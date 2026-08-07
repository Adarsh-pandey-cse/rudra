const sharp = require('sharp');
const path = require('path');

async function run() {
  try {
    const input1 = path.join(__dirname, 'public', 'icons', 'icon-192x192.jpg');
    const input2 = path.join(__dirname, 'public', 'icons', 'icon-512x512.jpg');
    
    const output1 = path.join(__dirname, 'public', 'icons', 'icon-192x192.png');
    const output2 = path.join(__dirname, 'public', 'icons', 'icon-512x512.png');
    
    await sharp(input1).png().toFile(output1);
    await sharp(input2).png().toFile(output2);
    
    console.log("Converted icons to PNG");
  } catch (err) {
    console.error(err);
  }
}

run();
