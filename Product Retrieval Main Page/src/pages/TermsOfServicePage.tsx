import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { translate } from '../lib/i18n';
import { useLanguage } from '../lib/LanguageContext';
import { Header } from '../components/Header';

const content = {
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: April 2026',
    back: 'Back',
    sections: [
      {
        heading: '1. About Uniy Market',
        body: 'Uniy Market is a campus second-hand trading platform developed by the UniyMarket team as a Senior Project at the Faculty of Information and Communication Technology (ICT), Mahidol University. This platform is designed for university students to buy, sell, and exchange second-hand goods within the campus community. Uniy Market is a non-commercial academic project and does not charge any fees for its services.',
      },
      {
        heading: '2. Eligibility',
        body: 'To use Uniy Market, you must be a current student, faculty member, or staff of a recognized university. You must register with a valid email address and verify your identity through our email verification process. Users who complete education email verification (.edu or .ac.* domain) will receive a verified badge. You must be at least 18 years old to use this platform.',
      },
      {
        heading: '3. Account Responsibilities',
        body: 'You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others or create multiple accounts. You are responsible for all activities that occur under your account. If you suspect unauthorized access, please contact the administrator immediately.',
      },
      {
        heading: '4. Listing and Trading Rules',
        body: 'All product listings must be accurate and truthful. You must not list prohibited items including but not limited to: illegal goods, weapons, drugs, counterfeit products, stolen property, or any items that violate applicable laws. Prices must be listed in Thai Baht (฿). Sellers are responsible for the quality and condition of their listed items. All transactions are conducted directly between buyers and sellers; Uniy Market does not act as an intermediary or guarantee any transaction.',
      },
      {
        heading: '5. Communication',
        body: 'Uniy Market provides a real-time chat system for buyers and sellers to communicate. You must not use the chat system to send spam, harassment, threats, or any inappropriate content. Messages may be subject to content moderation. The platform supports message translation for cross-language communication.',
      },
      {
        heading: '6. Content Standards',
        body: 'All content you post (product listings, descriptions, images, reviews, comments) must comply with community standards. Content that is offensive, discriminatory, fraudulent, or violates intellectual property rights will be removed. The platform employs automated content moderation to flag potentially inappropriate content.',
      },
      {
        heading: '7. Reviews and Ratings',
        body: 'After completing a transaction, both parties may leave reviews. Reviews must be honest and based on actual transaction experience. Fake reviews, review manipulation, or retaliatory reviews are prohibited.',
      },
      {
        heading: '8. Reporting and Enforcement',
        body: 'Users can report inappropriate listings, messages, or other users through the built-in reporting system. The admin team will review reports and take appropriate action, which may include content removal, account suspension, or permanent account deletion. Suspended users can still log in to view content but cannot perform any write operations (posting, messaging, buying, etc.).',
      },
      {
        heading: '9. Intellectual Property',
        body: 'Uniy Market and its original content, features, and functionality are the intellectual property of the UniyMarket team at Mahidol University ICT. The platform is built as an academic project and is licensed under the MIT License.',
      },
      {
        heading: '10. Limitation of Liability',
        body: 'Uniy Market is provided "as is" without warranties of any kind. As an academic project, we do not guarantee uninterrupted service availability. We are not responsible for any disputes, losses, or damages arising from transactions between users. Users are advised to meet in public campus areas for face-to-face exchanges and to verify product condition before completing payment.',
      },
      {
        heading: '11. Modifications',
        body: 'We reserve the right to modify these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.',
      },
      {
        heading: '12. Contact',
        body: 'For questions about these Terms of Service, please contact the Uniy Market team at: shaojun.wen@student.mahidol.edu',
      },
    ],
  },
  zh: {
    title: '服务条款',
    lastUpdated: '最后更新：2026年4月',
    back: '返回',
    sections: [
      {
        heading: '1. 关于 Uniy Market',
        body: 'Uniy Market 是由 UniyMarket 团队开发的校园二手交易平台，作为泰国玛希隆大学信息与通信技术学院（ICT）的毕业设计项目。本平台旨在为大学生提供一个在校园社区内买卖和交换二手商品的平台。Uniy Market 是非商业性质的学术项目，不收取任何服务费用。',
      },
      {
        heading: '2. 使用资格',
        body: '使用 Uniy Market，您必须是经认可的大学的在校学生、教职员工。您必须使用有效的电子邮箱注册并通过我们的邮箱验证流程验证身份。完成教育邮箱认证（.edu 或 .ac.* 域名）的用户将获得认证徽章。您必须年满18周岁才能使用本平台。',
      },
      {
        heading: '3. 账户责任',
        body: '您有责任保管好您的账户凭证。不得与他人共享账户或创建多个账户。您对账户下发生的所有活动负责。如果您怀疑账户被未授权访问，请立即联系管理员。',
      },
      {
        heading: '4. 商品发布与交易规则',
        body: '所有商品信息必须准确真实。禁止发布违禁物品，包括但不限于：违法物品、武器、毒品、假冒产品、赃物或任何违反适用法律的物品。价格必须以泰铢（฿）标注。卖家对所发布商品的质量和状况负责。所有交易均在买卖双方之间直接进行，Uniy Market 不作为中间方，也不对任何交易提供担保。',
      },
      {
        heading: '5. 通讯规则',
        body: 'Uniy Market 提供实时聊天系统供买卖双方沟通。禁止使用聊天系统发送垃圾信息、骚扰、威胁或任何不当内容。消息可能受到内容审核。平台支持消息翻译以便跨语言交流。',
      },
      {
        heading: '6. 内容标准',
        body: '您发布的所有内容（商品信息、描述、图片、评价、评论）必须符合社区标准。冒犯性、歧视性、欺诈性或侵犯知识产权的内容将被删除。平台采用自动内容审核系统来标记潜在的不当内容。',
      },
      {
        heading: '7. 评价与评分',
        body: '交易完成后，双方均可留下评价。评价必须诚实且基于真实的交易体验。禁止虚假评价、评价操纵或报复性评价。',
      },
      {
        heading: '8. 举报与执行',
        body: '用户可以通过内置举报系统举报不当商品、消息或其他用户。管理团队将审核举报并采取适当措施，包括删除内容、暂停账户或永久删除账户。被暂停的用户仍可登录查看内容，但无法执行任何写操作（发布、发消息、购买等）。',
      },
      {
        heading: '9. 知识产权',
        body: 'Uniy Market 及其原创内容、功能和特性是玛希隆大学 ICT 学院 UniyMarket 团队的知识产权。本平台作为学术项目开发，采用 MIT 许可证授权。',
      },
      {
        heading: '10. 责任限制',
        body: 'Uniy Market 按"现状"提供，不提供任何形式的保证。作为学术项目，我们不保证服务的持续可用性。我们不对用户之间交易产生的任何纠纷、损失或损害承担责任。建议用户在校园公共区域进行面对面交易，并在付款前验证商品状况。',
      },
      {
        heading: '11. 条款修改',
        body: '我们保留随时修改本服务条款的权利。在条款更改后继续使用平台即表示接受更新后的条款。',
      },
      {
        heading: '12. 联系方式',
        body: '如对本服务条款有任何疑问，请联系 Uniy Market 团队：shaojun.wen@student.mahidol.edu',
      },
    ],
  },
  th: {
    title: 'ข้อกำหนดการใช้งาน',
    lastUpdated: 'อัปเดตล่าสุด: เมษายน 2569',
    back: 'กลับ',
    sections: [
      {
        heading: '1. เกี่ยวกับ Uniy Market',
        body: 'Uniy Market เป็นแพลตฟอร์มซื้อขายสินค้ามือสองในมหาวิทยาลัย พัฒนาโดยทีม UniyMarket เป็นโปรเจกต์ปริญญานิพนธ์ (Senior Project) ของคณะเทคโนโลยีสารสนเทศและการสื่อสาร (ICT) มหาวิทยาลัยมหิดล แพลตฟอร์มนี้ออกแบบมาเพื่อให้นักศึกษามหาวิทยาลัยซื้อ ขาย และแลกเปลี่ยนสินค้ามือสองภายในชุมชนมหาวิทยาลัย Uniy Market เป็นโปรเจกต์วิชาการที่ไม่แสวงหาผลกำไรและไม่เรียกเก็บค่าบริการใดๆ',
      },
      {
        heading: '2. คุณสมบัติผู้ใช้',
        body: 'ในการใช้ Uniy Market คุณต้องเป็นนักศึกษา อาจารย์ หรือบุคลากรของมหาวิทยาลัยที่ได้รับการรับรอง คุณต้องลงทะเบียนด้วยอีเมลที่ถูกต้องและยืนยันตัวตนผ่านกระบวนการยืนยันอีเมลของเรา ผู้ใช้ที่ยืนยันอีเมลการศึกษา (โดเมน .edu หรือ .ac.*) จะได้รับตราสัญลักษณ์ยืนยัน คุณต้องมีอายุอย่างน้อย 18 ปีจึงจะใช้แพลตฟอร์มนี้ได้',
      },
      {
        heading: '3. ความรับผิดชอบของบัญชี',
        body: 'คุณมีหน้าที่รักษาความลับของข้อมูลบัญชีของคุณ ห้ามแชร์บัญชีกับผู้อื่นหรือสร้างหลายบัญชี คุณต้องรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ หากคุณสงสัยว่ามีการเข้าถึงโดยไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบทันที',
      },
      {
        heading: '4. กฎการลงประกาศและการซื้อขาย',
        body: 'ข้อมูลสินค้าทั้งหมดต้องถูกต้องและเป็นจริง ห้ามลงประกาศสิ่งของต้องห้าม รวมถึงแต่ไม่จำกัดเพียง: สิ่งของผิดกฎหมาย อาวุธ ยาเสพติด สินค้าปลอม ทรัพย์สินที่ถูกขโมย หรือสิ่งของใดๆ ที่ละเมิดกฎหมายที่เกี่ยวข้อง ราคาต้องแสดงเป็นบาทไทย (฿) ผู้ขายต้องรับผิดชอบต่อคุณภาพและสภาพของสินค้าที่ลงประกาศ การทำธุรกรรมทั้งหมดดำเนินการโดยตรงระหว่างผู้ซื้อและผู้ขาย Uniy Market ไม่ได้ทำหน้าที่เป็นตัวกลางหรือรับประกันการทำธุรกรรมใดๆ',
      },
      {
        heading: '5. กฎการสื่อสาร',
        body: 'Uniy Market มีระบบแชทแบบเรียลไทม์สำหรับผู้ซื้อและผู้ขายในการสื่อสาร ห้ามใช้ระบบแชทส่งสแปม การคุกคาม การข่มขู่ หรือเนื้อหาที่ไม่เหมาะสม ข้อความอาจถูกตรวจสอบเนื้อหา แพลตฟอร์มรองรับการแปลข้อความเพื่อการสื่อสารข้ามภาษา',
      },
      {
        heading: '6. มาตรฐานเนื้อหา',
        body: 'เนื้อหาทั้งหมดที่คุณโพสต์ (ข้อมูลสินค้า คำอธิบาย รูปภาพ รีวิว ความคิดเห็น) ต้องเป็นไปตามมาตรฐานชุมชน เนื้อหาที่ไม่เหมาะสม เลือกปฏิบัติ ฉ้อโกง หรือละเมิดทรัพย์สินทางปัญญาจะถูกลบ แพลตฟอร์มใช้ระบบตรวจสอบเนื้อหาอัตโนมัติเพื่อตรวจจับเนื้อหาที่อาจไม่เหมาะสม',
      },
      {
        heading: '7. รีวิวและการให้คะแนน',
        body: 'หลังจากทำธุรกรรมเสร็จสิ้น ทั้งสองฝ่ายสามารถเขียนรีวิวได้ รีวิวต้องซื่อสัตย์และอิงจากประสบการณ์การทำธุรกรรมจริง ห้ามรีวิวปลอม การบิดเบือนรีวิว หรือรีวิวเพื่อแก้แค้น',
      },
      {
        heading: '8. การรายงานและการบังคับใช้',
        body: 'ผู้ใช้สามารถรายงานประกาศ ข้อความ หรือผู้ใช้อื่นที่ไม่เหมาะสมผ่านระบบรายงานในตัว ทีมผู้ดูแลจะตรวจสอบรายงานและดำเนินการที่เหมาะสม ซึ่งอาจรวมถึงการลบเนื้อหา การระงับบัญชี หรือการลบบัญชีถาวร ผู้ใช้ที่ถูกระงับยังสามารถเข้าสู่ระบบเพื่อดูเนื้อหาได้ แต่ไม่สามารถดำเนินการเขียนใดๆ (โพสต์ ส่งข้อความ ซื้อ ฯลฯ)',
      },
      {
        heading: '9. ทรัพย์สินทางปัญญา',
        body: 'Uniy Market และเนื้อหาต้นฉบับ ฟีเจอร์ และฟังก์ชันการทำงานเป็นทรัพย์สินทางปัญญาของทีม UniyMarket คณะ ICT มหาวิทยาลัยมหิดล แพลตฟอร์มนี้พัฒนาเป็นโปรเจกต์วิชาการและอยู่ภายใต้สัญญาอนุญาต MIT',
      },
      {
        heading: '10. ข้อจำกัดความรับผิดชอบ',
        body: 'Uniy Market ให้บริการ "ตามสภาพ" โดยไม่มีการรับประกันใดๆ ในฐานะโปรเจกต์วิชาการ เราไม่รับประกันความพร้อมใช้งานของบริการอย่างต่อเนื่อง เราไม่รับผิดชอบต่อข้อพิพาท ความสูญเสีย หรือความเสียหายที่เกิดจากการทำธุรกรรมระหว่างผู้ใช้ แนะนำให้ผู้ใช้นัดพบกันในพื้นที่สาธารณะของมหาวิทยาลัยสำหรับการแลกเปลี่ยนแบบพบหน้า และตรวจสอบสภาพสินค้าก่อนชำระเงิน',
      },
      {
        heading: '11. การแก้ไขข้อกำหนด',
        body: 'เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดการใช้งานเหล่านี้ได้ตลอดเวลา การใช้แพลตฟอร์มต่อไปหลังจากมีการเปลี่ยนแปลงถือว่ายอมรับข้อกำหนดที่อัปเดต',
      },
      {
        heading: '12. ติดต่อเรา',
        body: 'หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งานเหล่านี้ กรุณาติดต่อทีม Uniy Market ที่: shaojun.wen@student.mahidol.edu',
      },
    ],
  },
};

export default function TermsOfServicePage() {
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
                  <p className="text-gray-700 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
