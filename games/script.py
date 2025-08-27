import json

# filepath: c:\Project\Sing\games\sommar2025.json
file_path = r"c:\Project\Sing\games\sommar2025.json"

def update_song_numbers(file_path):
    # Read the file as plain text
    with open(file_path, "r", encoding="utf-8") as file:
        file_content = file.read()
        data = json.loads(file_content)

    # Start numbering with "X" for the first song, then increment from 1
    next_number = 1
    for song in data:
        if next_number == 1:  # First song gets "X"
            song["songNumber"] = "X"
        else:
            song["songNumber"] = str(next_number - 1)
        next_number += 1

    # Write the updated JSON back to the file as plain text
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(json.dumps(data, ensure_ascii=False, indent=4))

    print("Song numbers updated successfully!")

# Run the function
update_song_numbers(file_path)