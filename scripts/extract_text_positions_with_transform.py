import os
import re
import math
import xml.etree.ElementTree as ET
import json

def parse_transform(transform_str):
    """
    Parse an SVG transform string into a transformation matrix.
    Supports translate, scale, rotate, skewX, skewY, and matrix.
    Returns a 3x3 matrix as a list of lists.
    """
    matrix = [[1,0,0],[0,1,0],[0,0,1]]

    def matrix_multiply(m1, m2):
        result = [[0,0,0],[0,0,0],[0,0,0]]
        for i in range(3):
            for j in range(3):
                result[i][j] = sum(m1[i][k]*m2[k][j] for k in range(3))
        return result

    def translate(tx, ty=0):
        return [[1,0,tx],[0,1,ty],[0,0,1]]

    def scale(sx, sy=None):
        if sy is None:
            sy = sx
        return [[sx,0,0],[0,sy,0],[0,0,1]]

    def rotate(angle, cx=0, cy=0):
        rad = math.radians(angle)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        # Translate to origin, rotate, translate back
        return matrix_multiply(
            matrix_multiply(
                translate(cx, cy),
                [[cos_a, -sin_a, 0],[sin_a, cos_a, 0],[0,0,1]]
            ),
            translate(-cx, -cy)
        )

    def skewX(angle):
        rad = math.radians(angle)
        return [[1, math.tan(rad), 0],[0,1,0],[0,0,1]]

    def skewY(angle):
        rad = math.radians(angle)
        return [[1,0,0],[math.tan(rad),1,0],[0,0,1]]

    # Regex to parse transform functions
    pattern = re.compile(r'(\w+)\(([^)]+)\)')
    for func, values in pattern.findall(transform_str):
        nums = list(map(float, re.findall(r'[-+]?[0-9]*\.?[0-9]+', values)))
        if func == 'translate':
            m = translate(*nums)
        elif func == 'scale':
            m = scale(*nums)
        elif func == 'rotate':
            if len(nums) == 1:
                m = rotate(nums[0])
            elif len(nums) == 3:
                m = rotate(nums[0], nums[1], nums[2])
            else:
                continue
        elif func == 'skewX':
            m = skewX(nums[0])
        elif func == 'skewY':
            m = skewY(nums[0])
        elif func == 'matrix':
            if len(nums) == 6:
                m = [[nums[0], nums[2], nums[4]],
                     [nums[1], nums[3], nums[5]],
                     [0,0,1]]
            else:
                continue
        else:
            continue
        matrix = matrix_multiply(matrix, m)
    return matrix

def apply_transform(matrix, x, y):
    """
    Apply a 3x3 transformation matrix to a point (x,y).
    """
    px = matrix[0][0]*x + matrix[0][1]*y + matrix[0][2]
    py = matrix[1][0]*x + matrix[1][1]*y + matrix[1][2]
    return px, py

def get_cumulative_transform(element, ns):
    """
    Recursively get the cumulative transform matrix from the element and its parents.
    """
    transform = [[1,0,0],[0,1,0],[0,0,1]]
    current = element
    while current is not None:
        t = current.get('transform')
        if t:
            m = parse_transform(t)
            transform = matrix_multiply(m, transform)
        current = current.getparent() if hasattr(current, 'getparent') else current.getparent if hasattr(current, 'getparent') else None
    return transform

def extract_text_positions(svg_path):
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    pattern = re.compile(r'^\d{3,5}[A-Z]{0,2}$')
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
    except ET.ParseError as e:
        print(f"❌ Failed to parse {svg_path}: {e}")
        return []

    elements = []

    # We will use a stack to traverse elements with their cumulative transform
    stack = [(root, [[1,0,0],[0,1,0],[0,0,1]])]

    while stack:
        elem, cum_transform = stack.pop()
        # Update cumulative transform if element has transform attribute
        t = elem.get('transform')
        if t:
            m = parse_transform(t)
            cum_transform = matrix_multiply(cum_transform, m)

        # If element is text, extract text and coordinates
        if elem.tag.endswith('text'):
            x_attr = elem.get('x')
            y_attr = elem.get('y')
            x_vals = [float(x) for x in x_attr.replace(',', ' ').split()] if x_attr else [0]
            y_vals = [float(y) for y in y_attr.replace(',', ' ').split()] if y_attr else [0]
            # Gather all text, ignoring nested tspans that don't add positional x/y
            full_text = ""
            for node in elem.iter():
                if node.text:
                    full_text += node.text.strip()

            # Skip empty results or very short fragments
            if full_text and len(full_text) > 1 and pattern.match(full_text):
                x, y = apply_transform(cum_transform, x_vals[0], y_vals[0])
                elements.append({
                    'text': full_text,
                    'x': x,
                    'y': y
                })

        # Add children to stack
        for child in list(elem):
            stack.append((child, cum_transform))

    # Deduplicate by filtering out visually overlapping labels grouped by text label
    from collections import defaultdict
    grouped = defaultdict(list)
    for el in elements:
        grouped[el['text']].append(el)

    unique_elements = []
    for text, group in grouped.items():
        seen_coords = set()
        duplicates_count = 0
        for el in group:
            # Round x and y to nearest 0.5 to account for SVG precision noise
            rx = round(el['x'] * 2) / 2
            ry = round(el['y'] * 2) / 2
            key = (rx, ry)
            if key not in seen_coords:
                seen_coords.add(key)
                unique_elements.append(el)
            else:
                duplicates_count += 1
        if duplicates_count > 0:
            print(f"Discarded {duplicates_count} duplicates for label '{text}'")

    return unique_elements

def matrix_multiply(m1, m2):
    result = [[0,0,0],[0,0,0],[0,0,0]]
    for i in range(3):
        for j in range(3):
            result[i][j] = sum(m1[i][k]*m2[k][j] for k in range(3))
    return result

def process_all_svgs_in_folder(folder_path, output_json):
    all_data = {}
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.svg'):
            full_path = os.path.join(folder_path, filename)
            print(f"Processing {filename}...")
            extracted = extract_text_positions(full_path)
            all_data[filename] = extracted
            print(f"  Extracted {len(extracted)} text elements.")
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    print(f"✅ Extraction complete. Data saved to {output_json}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 3:
        print("Usage: python extract-text-positions-with-transform.py input.svg output.json")
        sys.exit(1)

    input_svg = sys.argv[1]
    output_json = sys.argv[2]

    extracted = extract_text_positions(input_svg)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(extracted, f, indent=2, ensure_ascii=False)
    print(f"✅ Extracted {len(extracted)} elements from {input_svg} to {output_json}")
