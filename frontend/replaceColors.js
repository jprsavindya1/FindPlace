const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const colorMap = [
  // Primary & Accents
  { regex: /#54acbf/gi, replacement: '#003580' },
  { regex: /rgba\(\s*84\s*,\s*172\s*,\s*191/g, replacement: 'rgba(0, 53, 128' },
  { regex: /#a7ebf2/gi, replacement: '#006CE4' },
  { regex: /rgba\(\s*167\s*,\s*235\s*,\s*242/g, replacement: 'rgba(0, 108, 228' },
  { regex: /#26658c/gi, replacement: '#006CE4' },
  { regex: /rgba\(\s*38\s*,\s*101\s*,\s*140/g, replacement: 'rgba(0, 108, 228' },
  { regex: /#38bdf8/gi, replacement: '#006CE4' },
  { regex: /rgba\(\s*56\s*,\s*189\s*,\s*248/g, replacement: 'rgba(0, 108, 228' },
  
  // Call to Action
  // Wait, I should find where primary buttons or highlights are and make them #F29111.
  // I will just let the Navy Blue and Royal Blue dominate, and manually change a few buttons to #F29111.
  // Actually, I can replace #54acbf in some places to #F29111, but the map above makes it #003580.
  
  // Backgrounds (Dark to Light)
  { regex: /#010e21/gi, replacement: '#FFFFFF' },
  { regex: /rgba\(\s*1\s*,\s*14\s*,\s*33/g, replacement: 'rgba(255, 255, 255' },
  { regex: /#011c40/gi, replacement: '#F8F9FA' },
  { regex: /rgba\(\s*1\s*,\s*28\s*,\s*64/g, replacement: 'rgba(248, 249, 250' },
  { regex: /#023859/gi, replacement: '#E9ECEF' },
  { regex: /rgba\(\s*2\s*,\s*56\s*,\s*89/g, replacement: 'rgba(233, 236, 239' },
  { regex: /rgba\(\s*11\s*,\s*17\s*,\s*33/g, replacement: 'rgba(245, 245, 245' },
  { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42/g, replacement: 'rgba(250, 250, 250' },
  { regex: /rgba\(\s*7\s*,\s*11\s*,\s*20/g, replacement: 'rgba(240, 240, 240' },
  { regex: /rgba\(\s*30\s*,\s*41\s*,\s*59/g, replacement: 'rgba(230, 230, 230' },
  
  // Texts
  { regex: /#f8fafc/gi, replacement: '#262626' },
  { regex: /#cbd5e1/gi, replacement: '#262626' },
  { regex: /#94a3b8/gi, replacement: '#666666' },
  { regex: /#64748b/gi, replacement: '#555555' },
  
  // Specific border color replacements to make light theme border visible
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05/g, replacement: 'rgba(0, 0, 0, 0.1' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08/g, replacement: 'rgba(0, 0, 0, 0.1' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1/g, replacement: 'rgba(0, 0, 0, 0.15' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.2/g, replacement: 'rgba(0, 0, 0, 0.2' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.02/g, replacement: 'rgba(0, 0, 0, 0.05' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.03/g, replacement: 'rgba(0, 0, 0, 0.05' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.04/g, replacement: 'rgba(0, 0, 0, 0.06' },
  { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.06/g, replacement: 'rgba(0, 0, 0, 0.1' }
];

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
      
      for (const rule of colorMap) {
        content = content.replace(rule.regex, rule.replacement);
      }
      
      // Also, we need to handle pure #ffffff text in specific contexts if needed, 
      // but for now let's manually verify or leave it, as replacing #ffffff might break buttons.
      // But wait! Titles are often #ffffff. E.g., `color: #ffffff;` 
      // Let's replace `color: #ffffff;` and `color:#ffffff;` and `color: '#ffffff'`
      content = content.replace(/color:\s*#ffffff/gi, 'color: #262626');
      content = content.replace(/color:\s*'#ffffff'/gi, "color: '#262626'");
      content = content.replace(/color:\s*"#ffffff"/gi, 'color: "#262626"');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Color replacement complete.");
