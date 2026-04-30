import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Header } from '../components/Header';

const content = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: April 2026',
    back: 'Back',
    sections: [
      {
        heading: '1. Introduction',
        body: 'This Privacy Policy explains how Uniy Market, a Senior Project developed by the UniyMarket team at the Faculty of Information and Communication Technology (ICT), Mahidol University, collects, uses, and protects your personal information. By using our platform, you consent to the practices described in this policy.',
      },
      {
        heading: '2. Information We Collect',
        body: 'We collect the following types of information:\n\n• Account Information: name, email address, password (stored as a bcrypt hash, never in plain text), and profile image.\n• Education Verification: education email address (.edu or .ac.* domain) for campus identity verification. This is optional and used solely to display a verified badge.\n• Product Listings: titles, descriptions, prices, images, condition, category, and optional location data (latitude, longitude, address) that you choose to provide.\n• Communication Data: chat messages between buyers and sellers, which may include text and images.\n• Transaction Records: deal history between buyers and sellers, including status and timestamps.\n• Usage Data: page views, product view counts, and basic interaction logs for platform improvement.',
      },
      {
        heading: '3. How We Use Your Information',
        body: 'Your information is used to:\n\n• Provide and maintain the trading platform functionality.\n• Verify your identity and university affiliation.\n• Enable communication between buyers and sellers.\n• Display seller profiles, ratings, and trade history to build community trust.\n• Moderate content and enforce community standards.\n• Send email verification codes and password reset codes via the Resend email service.\n• Provide message translation services via Google Cloud Translate (message content is sent to Google for translation when you use the translation feature).\n• Improve the platform through aggregated, anonymized usage analytics.',
      },
      {
        heading: '4. Location Data',
        body: 'When creating a product listing, you may optionally provide location information by selecting a point on the map. This location data is associated with the product listing and visible to other users to facilitate meetup arrangements. You are never required to share your precise location, and you can choose not to include location data in your listings.',
      },
      {
        heading: '5. Data Storage and Security',
        body: 'Your data is stored in a SQLite database on our server hosted on AWS (Singapore region). We implement the following security measures:\n\n• Passwords are hashed using bcrypt and never stored in plain text.\n• Authentication uses JSON Web Tokens (JWT) with secure session management.\n• API endpoints are protected by rate limiting to prevent abuse.\n• File uploads (images) are processed and compressed using Sharp.\n• HTTPS encryption is enforced in production via Nginx reverse proxy.\n• Security headers are set using Helmet middleware.\n• Input validation and sanitization are applied to all user inputs.',
      },
      {
        heading: '6. Data Sharing',
        body: 'We do not sell, trade, or rent your personal information to third parties. Your information may be shared in the following limited circumstances:\n\n• Public Profile: your name, profile image, verified status, rating, trade count, and join date are visible to other users.\n• Product Listings: listing information you post is publicly visible.\n• Chat Messages: messages are only visible to the participants of the conversation.\n• Translation Service: when you use the message translation feature, message content is sent to Google Cloud Translate.\n• Email Service: your email address is shared with Resend for sending verification codes.\n• Law Enforcement: we may disclose information if required by law.',
      },
      {
        heading: '7. Data Retention',
        body: 'Your account data is retained as long as your account is active. If your account is deleted by an administrator (hard delete), all associated data including profile information, product listings, and chat history will be permanently removed. Soft-deleted chat messages (single-side deletion) only hide the conversation from your view; the other party retains their copy.',
      },
      {
        heading: '8. Your Rights',
        body: 'You have the right to:\n\n• Access and view your personal information through your profile page.\n• Update your profile information, including name, bio, and profile image.\n• Delete your product listings at any time.\n• Request account deletion by contacting the administrator.\n• Opt out of education email verification (it is entirely optional).',
      },
      {
        heading: '9. Cookies and Local Storage',
        body: 'Uniy Market uses browser sessionStorage to store your authentication token and user session data. We also use localStorage to save your language preference. No third-party tracking cookies are used.',
      },
      {
        heading: '10. Children\'s Privacy',
        body: 'Uniy Market is intended for university students aged 18 and above. We do not knowingly collect personal information from individuals under 18 years of age.',
      },
      {
        heading: '11. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated "Last Updated" date. Continued use of the platform after changes constitutes acceptance of the updated policy.',
      },
      {
        heading: '12. Contact',
        body: 'If you have questions or concerns about this Privacy Policy or your personal data, please contact the Uniy Market team at: shaojun.wen@student.mahidol.edu',
      },
    ],
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年4月',
    back: '返回',
    sections: [
      {
        heading: '1. 简介',
        body: '本隐私政策说明了 Uniy Market（由泰国玛希隆大学信息与通信技术学院 ICT 的 UniyMarket 团队开发的毕业设计项目）如何收集、使用和保护您的个人信息。使用我们的平台即表示您同意本政策中描述的做法。',
      },
      {
        heading: '2. 我们收集的信息',
        body: '我们收集以下类型的信息：\n\n• 账户信息：姓名、电子邮箱、密码（以 bcrypt 哈希存储，绝不以明文保存）和头像。\n• 教育认证：教育邮箱地址（.edu 或 .ac.* 域名），用于校园身份验证。这是可选的，仅用于显示认证徽章。\n• 商品信息：标题、描述、价格、图片、成色、分类，以及您选择提供的可选位置数据（经纬度、地址）。\n• 通讯数据：买卖双方之间的聊天消息，可能包括文字和图片。\n• 交易记录：买卖双方之间的交易历史，包括状态和时间戳。\n• 使用数据：页面浏览量、商品浏览次数和基本交互日志，用于平台改进。',
      },
      {
        heading: '3. 我们如何使用您的信息',
        body: '您的信息用于：\n\n• 提供和维护交易平台功能。\n• 验证您的身份和大学归属。\n• 实现买卖双方之间的沟通。\n• 展示卖家资料、评分和交易历史，以建立社区信任。\n• 审核内容并执行社区标准。\n• 通过 Resend 邮件服务发送邮箱验证码和密码重置码。\n• 通过 Google Cloud Translate 提供消息翻译服务（使用翻译功能时，消息内容会发送至 Google 进行翻译）。\n• 通过汇总的匿名使用分析来改进平台。',
      },
      {
        heading: '4. 位置数据',
        body: '创建商品时，您可以选择在地图上标注位置信息。此位置数据与商品关联，对其他用户可见，以便安排见面交易。您无需分享精确位置，也可以选择不在商品中包含位置数据。',
      },
      {
        heading: '5. 数据存储与安全',
        body: '您的数据存储在我们托管于 AWS（新加坡区域）的服务器上的 SQLite 数据库中。我们实施以下安全措施：\n\n• 密码使用 bcrypt 哈希加密，绝不以明文存储。\n• 身份认证使用 JSON Web Token (JWT) 和安全的会话管理。\n• API 端点受到请求频率限制保护，防止滥用。\n• 文件上传（图片）使用 Sharp 进行处理和压缩。\n• 生产环境通过 Nginx 反向代理强制使用 HTTPS 加密。\n• 使用 Helmet 中间件设置安全头。\n• 对所有用户输入进行验证和清洗。',
      },
      {
        heading: '6. 数据共享',
        body: '我们不会出售、交易或出租您的个人信息给第三方。您的信息仅在以下有限情况下共享：\n\n• 公开资料：您的姓名、头像、认证状态、评分、交易次数和加入日期对其他用户可见。\n• 商品信息：您发布的商品信息公开可见。\n• 聊天消息：消息仅对对话参与者可见。\n• 翻译服务：使用消息翻译功能时，消息内容会发送至 Google Cloud Translate。\n• 邮件服务：您的邮箱地址会与 Resend 共享以发送验证码。\n• 执法要求：如法律要求，我们可能会披露信息。',
      },
      {
        heading: '7. 数据保留',
        body: '只要您的账户处于活跃状态，您的账户数据就会被保留。如果管理员删除您的账户（硬删除），所有相关数据（包括个人资料、商品信息和聊天记录）将被永久删除。软删除的聊天消息（单方面删除）仅从您的视图中隐藏对话，对方仍保留其副本。',
      },
      {
        heading: '8. 您的权利',
        body: '您有权：\n\n• 通过个人资料页面访问和查看您的个人信息。\n• 更新您的个人资料，包括姓名、简介和头像。\n• 随时删除您的商品。\n• 联系管理员请求删除账户。\n• 选择不进行教育邮箱认证（这完全是可选的）。',
      },
      {
        heading: '9. Cookie 和本地存储',
        body: 'Uniy Market 使用浏览器 sessionStorage 存储您的认证令牌和用户会话数据，使用 localStorage 保存您的语言偏好。我们不使用任何第三方跟踪 Cookie。',
      },
      {
        heading: '10. 未成年人隐私',
        body: 'Uniy Market 面向18岁及以上的大学生。我们不会故意收集18岁以下个人的个人信息。',
      },
      {
        heading: '11. 政策变更',
        body: '我们可能会不时更新本隐私政策。任何更改将在本页面上反映，并更新"最后更新"日期。在更改后继续使用平台即表示接受更新后的政策。',
      },
      {
        heading: '12. 联系方式',
        body: '如对本隐私政策或您的个人数据有任何疑问，请联系 Uniy Market 团队：shaojun.wen@student.mahidol.edu',
      },
    ],
  },
  th: {
    title: 'นโยบายความเป็นส่วนตัว',
    lastUpdated: 'อัปเดตล่าสุด: เมษายน 2569',
    back: 'กลับ',
    sections: [
      {
        heading: '1. บทนำ',
        body: 'นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่ Uniy Market ซึ่งเป็นโปรเจกต์ปริญญานิพนธ์ (Senior Project) ที่พัฒนาโดยทีม UniyMarket คณะเทคโนโลยีสารสนเทศและการสื่อสาร (ICT) มหาวิทยาลัยมหิดล เก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ การใช้แพลตฟอร์มของเราแสดงว่าคุณยินยอมตามแนวปฏิบัติที่อธิบายไว้ในนโยบายนี้',
      },
      {
        heading: '2. ข้อมูลที่เราเก็บรวบรวม',
        body: 'เราเก็บรวบรวมข้อมูลประเภทต่อไปนี้:\n\n• ข้อมูลบัญชี: ชื่อ อีเมล รหัสผ่าน (จัดเก็บเป็น bcrypt hash ไม่เก็บเป็นข้อความธรรมดา) และรูปโปรไฟล์\n• การยืนยันการศึกษา: อีเมลการศึกษา (โดเมน .edu หรือ .ac.*) สำหรับยืนยันตัวตนในมหาวิทยาลัย เป็นทางเลือกและใช้เพื่อแสดงตราสัญลักษณ์ยืนยันเท่านั้น\n• ข้อมูลสินค้า: ชื่อ คำอธิบาย ราคา รูปภาพ สภาพ หมวดหมู่ และข้อมูลตำแหน่งที่เลือก (ละติจูด ลองจิจูด ที่อยู่)\n• ข้อมูลการสื่อสาร: ข้อความแชทระหว่างผู้ซื้อและผู้ขาย ซึ่งอาจรวมถึงข้อความและรูปภาพ\n• บันทึกการทำธุรกรรม: ประวัติการซื้อขายระหว่างผู้ซื้อและผู้ขาย รวมถึงสถานะและเวลา\n• ข้อมูลการใช้งาน: จำนวนการดูหน้า จำนวนการดูสินค้า และบันทึกการโต้ตอบพื้นฐานเพื่อปรับปรุงแพลตฟอร์ม',
      },
      {
        heading: '3. วิธีที่เราใช้ข้อมูลของคุณ',
        body: 'ข้อมูลของคุณถูกใช้เพื่อ:\n\n• ให้บริการและดูแลรักษาฟังก์ชันแพลตฟอร์มการซื้อขาย\n• ยืนยันตัวตนและสังกัดมหาวิทยาลัยของคุณ\n• เปิดใช้งานการสื่อสารระหว่างผู้ซื้อและผู้ขาย\n• แสดงโปรไฟล์ผู้ขาย คะแนน และประวัติการซื้อขายเพื่อสร้างความไว้วางใจในชุมชน\n• ตรวจสอบเนื้อหาและบังคับใช้มาตรฐานชุมชน\n• ส่งรหัสยืนยันอีเมลและรหัสรีเซ็ตรหัสผ่านผ่านบริการอีเมล Resend\n• ให้บริการแปลข้อความผ่าน Google Cloud Translate (เนื้อหาข้อความจะถูกส่งไปยัง Google เมื่อคุณใช้ฟีเจอร์แปลภาษา)\n• ปรับปรุงแพลตฟอร์มผ่านการวิเคราะห์การใช้งานแบบรวมและไม่ระบุตัวตน',
      },
      {
        heading: '4. ข้อมูลตำแหน่ง',
        body: 'เมื่อสร้างประกาศสินค้า คุณสามารถเลือกระบุข้อมูลตำแหน่งโดยเลือกจุดบนแผนที่ ข้อมูลตำแหน่งนี้เชื่อมโยงกับประกาศสินค้าและผู้ใช้อื่นสามารถเห็นได้เพื่ออำนวยความสะดวกในการนัดพบ คุณไม่จำเป็นต้องแชร์ตำแหน่งที่แน่นอน และสามารถเลือกไม่รวมข้อมูลตำแหน่งในประกาศของคุณ',
      },
      {
        heading: '5. การจัดเก็บข้อมูลและความปลอดภัย',
        body: 'ข้อมูลของคุณจัดเก็บในฐานข้อมูล SQLite บนเซิร์ฟเวอร์ของเราที่โฮสต์บน AWS (ภูมิภาคสิงคโปร์) เราใช้มาตรการรักษาความปลอดภัยดังต่อไปนี้:\n\n• รหัสผ่านถูกเข้ารหัสด้วย bcrypt และไม่เก็บเป็นข้อความธรรมดา\n• การยืนยันตัวตนใช้ JSON Web Token (JWT) พร้อมการจัดการเซสชันที่ปลอดภัย\n• API endpoints ได้รับการป้องกันด้วยการจำกัดอัตราคำขอเพื่อป้องกันการใช้งานในทางที่ผิด\n• ไฟล์อัปโหลด (รูปภาพ) ถูกประมวลผลและบีบอัดด้วย Sharp\n• การเข้ารหัส HTTPS ถูกบังคับใช้ในโปรดักชันผ่าน Nginx reverse proxy\n• ตั้งค่า security headers ด้วย Helmet middleware\n• มีการตรวจสอบและทำความสะอาดข้อมูลนำเข้าทั้งหมดจากผู้ใช้',
      },
      {
        heading: '6. การแบ่งปันข้อมูล',
        body: 'เราไม่ขาย แลกเปลี่ยน หรือให้เช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลที่สาม ข้อมูลของคุณอาจถูกแบ่งปันในสถานการณ์จำกัดดังต่อไปนี้:\n\n• โปรไฟล์สาธารณะ: ชื่อ รูปโปรไฟล์ สถานะยืนยัน คะแนน จำนวนการซื้อขาย และวันที่เข้าร่วมของคุณจะปรากฏแก่ผู้ใช้อื่น\n• ประกาศสินค้า: ข้อมูลสินค้าที่คุณโพสต์จะปรากฏต่อสาธารณะ\n• ข้อความแชท: ข้อความจะปรากฏเฉพาะผู้เข้าร่วมการสนทนาเท่านั้น\n• บริการแปลภาษา: เมื่อคุณใช้ฟีเจอร์แปลข้อความ เนื้อหาข้อความจะถูกส่งไปยัง Google Cloud Translate\n• บริการอีเมล: อีเมลของคุณจะถูกแบ่งปันกับ Resend เพื่อส่งรหัสยืนยัน\n• การบังคับใช้กฎหมาย: เราอาจเปิดเผยข้อมูลหากกฎหมายกำหนด',
      },
      {
        heading: '7. การเก็บรักษาข้อมูล',
        body: 'ข้อมูลบัญชีของคุณจะถูกเก็บรักษาตราบเท่าที่บัญชีของคุณยังใช้งานอยู่ หากผู้ดูแลระบบลบบัญชีของคุณ (ลบถาวร) ข้อมูลที่เกี่ยวข้องทั้งหมดรวมถึงข้อมูลโปรไฟล์ ประกาศสินค้า และประวัติแชทจะถูกลบอย่างถาวร ข้อความแชทที่ลบแบบซอฟต์ (ลบฝ่ายเดียว) จะซ่อนการสนทนาจากมุมมองของคุณเท่านั้น อีกฝ่ายยังคงเก็บสำเนาของตน',
      },
      {
        heading: '8. สิทธิ์ของคุณ',
        body: 'คุณมีสิทธิ์:\n\n• เข้าถึงและดูข้อมูลส่วนบุคคลของคุณผ่านหน้าโปรไฟล์\n• อัปเดตข้อมูลโปรไฟล์ รวมถึงชื่อ ประวัติ และรูปโปรไฟล์\n• ลบประกาศสินค้าของคุณได้ตลอดเวลา\n• ขอลบบัญชีโดยติดต่อผู้ดูแลระบบ\n• เลือกไม่ยืนยันอีเมลการศึกษา (เป็นทางเลือกทั้งหมด)',
      },
      {
        heading: '9. คุกกี้และที่เก็บข้อมูลในเครื่อง',
        body: 'Uniy Market ใช้ sessionStorage ของเบราว์เซอร์เพื่อจัดเก็บโทเค็นการยืนยันตัวตนและข้อมูลเซสชันผู้ใช้ เรายังใช้ localStorage เพื่อบันทึกการตั้งค่าภาษาของคุณ เราไม่ใช้คุกกี้ติดตามจากบุคคลที่สาม',
      },
      {
        heading: '10. ความเป็นส่วนตัวของเด็ก',
        body: 'Uniy Market มีไว้สำหรับนักศึกษามหาวิทยาลัยอายุ 18 ปีขึ้นไป เราไม่เก็บรวบรวมข้อมูลส่วนบุคคลจากบุคคลที่มีอายุต่ำกว่า 18 ปีโดยเจตนา',
      },
      {
        heading: '11. การเปลี่ยนแปลงนโยบาย',
        body: 'เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงใดๆ จะแสดงบนหน้านี้พร้อมวันที่ "อัปเดตล่าสุด" ที่อัปเดต การใช้แพลตฟอร์มต่อไปหลังจากมีการเปลี่ยนแปลงถือว่ายอมรับนโยบายที่อัปเดต',
      },
      {
        heading: '12. ติดต่อเรา',
        body: 'หากมีคำถามหรือข้อกังวลเกี่ยวกับนโยบายความเป็นส่วนตัวนี้หรือข้อมูลส่วนบุคคลของคุณ กรุณาติดต่อทีม Uniy Market ที่: shaojun.wen@student.mahidol.edu',
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = (key: any) => translate(language, key);
  const c = content[language] || content.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header language={language} setLanguage={setLanguage} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {c.back}
        </Button>
        <Card>
          <CardContent className="p-6 md:p-10">
            <h1 className="text-3xl font-bold mb-2">{c.title}</h1>
            <p className="text-sm text-gray-500 mb-8">{c.lastUpdated}</p>
            <div className="space-y-6">
              {c.sections.map((section, i) => (
                <div key={i}>
                  <h2 className="text-lg font-semibold mb-2">{section.heading}</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
