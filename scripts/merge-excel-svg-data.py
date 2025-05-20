import os
import json
import pandas as pd

def merge_excel_with_svg_data(excel_path, json_path, output_json_path):
    # Read Excel file
    df = pd.read_excel(excel_path, engine='openpyxl')

    # Load JSON data from SVG extraction
    with open(json_path, 'r', encoding='utf-8') as f:
        svg_data = json.load(f)

    # Prepare a dictionary to hold merged data
    merged_data = {}

    # We assume the JSON keys are filenames, e.g. "UNH-3 11x17.svg"
    for svg_file, texts in svg_data.items():
        merged_data[svg_file] = []

        # For each row in Excel, find matching text in SVG data by RoomID
        for _, row in df.iterrows():
            room_id = str(row.get('RoomID') or row.get('Room ID') or row.get('RoomId') or row.get('Room Id'))
            if not room_id:
                continue

            # Find matching text element(s) in SVG data
            matches = [t for t in texts if t['text'] == room_id]

            for match in matches:
                merged_entry = {
                    'RoomID': room_id,
                    'OrgType Name': row.get('OrgType Name'),
                    'Room Name': row.get('Room Name'),
                    'Room Area': row.get('Room Area'),
                    'x': match.get('x'),
                    'y': match.get('y')
                }
                merged_data[svg_file].append(merged_entry)

    # Save merged data to JSON
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Merged data saved to {output_json_path}")

if __name__ == '__main__':
    folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'UHALL Layout Project', 'Text Extraction'))
    import glob

    # Find the exact Excel file in the folder to avoid typos
    excel_files = glob.glob(os.path.join(folder, '*.xlsx'))
    if not excel_files:
        raise FileNotFoundError("No Excel file found in the folder")
    excel_file = excel_files[0]
    svg_json_file = os.path.join(folder, 'all_svg_text_coordinates_with_transform.json')
    output_file = os.path.join(folder, 'merged_room_data.json')

    merge_excel_with_svg_data(excel_file, svg_json_file, output_file)
