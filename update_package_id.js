const fs = require('fs');
const path = require('path');

// Path to the file where your Sui deployment results are stored
const resultsPath = path.join(__dirname, 'publish-output.json');
const appPath = path.join(__dirname, 'SmartphoneApp/App.js');

try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Find the Package ID in the Sui transaction effects
    const packageId = data.objectChanges.find(obj => obj.type === 'published').packageId;

    if (packageId) {
        console.log(`🚀 Found Package ID: ${packageId}`);
        
        let appContent = fs.readFileSync(appPath, 'utf8');
        // Replace the placeholder or old ID
        const updatedContent = appContent.replace(
            /const PACKAGE_ID = ".*?";/,
            `const PACKAGE_ID = "${packageId}";`
        );

        fs.writeFileSync(appPath, updatedContent);
        console.log('✅ App.js updated successfully with the new Sui Package ID!');
    }
} catch (error) {
    console.error('❌ Error: Ensure you have run the publish command and saved output to publish-output.json');
}
