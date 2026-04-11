const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.css') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Fix .btn-primary text color in CSS
      content = content.replace(/(\.btn-primary\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');
      // Fix .primary-login-btn
      content = content.replace(/(\.primary-login-btn\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');
      // Fix .hotel-overlay h3
      content = content.replace(/(\.hotel-overlay\s+h3\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');
      // Fix .reserve-btn
      content = content.replace(/(\.reserve-btn\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');
      // Fix .step-icon
      content = content.replace(/(\.step-icon\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');
      // Fix h1, h2 inside overlay or hero in Login.css, PlaceDetails.css
      content = content.replace(/(\.login-hero-text\s+h1\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');
      content = content.replace(/(\.place-hero-content\s+h1\s*\{[^}]*?color:\s*)#262626(;|})/g, '$1#ffffff$2');

      // Add more specific fixes if buttons have #262626 but they have backgrounds of #003580 or #006CE4
      // Let's use a regex to look for backgrounds of #003580 or #006CE4 or linear-gradients of them,
      // and if the text color inside that block is #262626, change it to #ffffff
      
      // Since regex for nested braces is hard, let's just forcefully replace color: #262626 with color: #ffffff
      // anywhere it's closely following a background with #003580 or #006CE4.
      const blockRegex = /([^{]+)\{([^}]+)\}/g;
      content = content.replace(blockRegex, (match, selector, body) => {
        if ((body.includes('background: #003580') || body.includes('background: #006CE4') || body.includes('linear-gradient') && body.includes('#003580')) && body.includes('color: #262626')) {
          return match.replace(/color:\s*#262626/g, 'color: #ffffff');
        }
        return match;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed buttons: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Button fix complete.");
