const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../data/unity_market.db'));

// 测试账号和密码
const testAccounts = [
  { userID: 'USER-1', password: 'admin123' },
  { userID: 'USER-2', password: 'john123' },
  { userID: 'USER-3', password: 'jane123' },
  { userID: 'USER-4', password: 'mike123' },
  { userID: 'USER-5', password: 'sarah123' },
];

async function setPasswords() {
  for (const account of testAccounts) {
    try {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      db.run(
        'UPDATE User SET password = ? WHERE userID = ?',
        [hashedPassword, account.userID],
        (err) => {
          if (err) {
            console.error(`Error updating ${account.userID}:`, err);
          } else {
            console.log(`✅ Set password for ${account.userID}: ${account.password}`);
          }
        }
      );
    } catch (error) {
      console.error(`Error hashing password for ${account.userID}:`, error);
    }
  }

  // 关闭数据库连接
  setTimeout(() => {
    db.close();
    console.log('\n✅ All passwords set successfully!');
    console.log('\nTest Accounts:');
    testAccounts.forEach(acc => {
      console.log(`  Email: ${acc.userID === 'USER-1' ? 'admin@university.edu' : 
                             acc.userID === 'USER-2' ? 'john.doe@university.edu' :
                             acc.userID === 'USER-3' ? 'jane.smith@university.edu' :
                             acc.userID === 'USER-4' ? 'mike.wilson@university.edu' :
                             'sarah.johnson@university.edu'}`);
      console.log(`  Password: ${acc.password}\n`);
    });
  }, 1000);
}

setPasswords();
