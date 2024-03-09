import json

# Load the JSON file
with open('2024.json', 'r') as file:
    data = json.load(file)

# Iterate over the songs and update the songNumber
for i, song in enumerate(data, start=1):
    song['songNumber'] = str(i)

# Save the updated JSON back to the file
with open('2024.json', 'w') as file:
    json.dump(data, file, indent=4)