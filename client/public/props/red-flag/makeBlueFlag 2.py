from PIL import Image
import os

# Create the directory if it doesn't exist
if not os.path.exists('client/public/props/blue-flag'):
    os.makedirs('client/public/props/blue-flag')

# Open an image file
with Image.open('client/public/props/red-flag/red-flag.png') as img:  # Corrected path
    # Get the image data
    data = img.load()

    # Go through each pixel in the image
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            # Get the RGB values of the pixel
            r, g, b, a = data[x, y]

            # If the pixel is red, change it to blue
            if r > 90 and g < 100 and b < 100:
                data[x, y] = (20, 20, 255, a)

    # Save the new image
    img.save('client/public/props/blue-flag/blue-flag.png')