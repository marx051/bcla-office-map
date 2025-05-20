import json
import os
from extract_text_positions_with_transform import extract_text_positions

def main():
    svg_path = os.path.abspath(os.path.join('uhall-layout', 'public', 'UNH-3 11x17.svg'))
    output_path = os.path.abspath(os.path.join('uhall-layout', 'data', 'new_room_coordinates_UNH3.json'))

    print(f"Extracting text positions from {svg_path}...")
    extracted_data = extract_text_positions(svg_path)
    print(f"Extracted {len(extracted_data)} text elements.")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(extracted_data, f, indent=2, ensure_ascii=False)
    print(f"Data saved to {output_path}")

if __name__ == '__main__':
    main()
