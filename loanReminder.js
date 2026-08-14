// สร้าง Flex Message แจ้งเตือนก่อนถึงกำหนดชำระเงินกู้
function money(num) {
  // แปลงตัวเลขให้มี comma คั่นหลักพัน + ทศนิยม 2 ตำแหน่ง
  return Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
}

function loanReminderFlex(name, loan) {
  // แปลงวันที่ครบกำหนดให้อ่านง่าย เช่น 5 ก.ย. 2569
  const dueText = new Date(loan.due_date).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    type: 'flex',
    altText: `แจ้งเตือน: ใกล้ถึงกำหนดชำระเงินกู้ ${dueText}`,
    contents: {
      type: 'bubble',
      // หัวข้อสีส้ม เพื่อให้รู้สึกว่าเป็นการแจ้งเตือน
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#e67e22',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '🔔 แจ้งเตือนชำระเงินกู้',
            color: '#ffffff',
            weight: 'bold',
            size: 'md',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `เรียนคุณ${name}`,
            weight: 'bold',
            size: 'lg',
            wrap: true,
          },
          {
            type: 'text',
            text: `ใกล้ถึงกำหนดชำระเงินกู้เลขที่ ${loan.loan_no} แล้วครับ`,
            wrap: true,
            size: 'sm',
            color: '#555555',
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: 'ยอดที่ต้องชำระ', size: 'sm', color: '#555555', flex: 2 },
              { type: 'text', text: money(loan.monthly_payment), size: 'sm', color: '#c0392b', weight: 'bold', flex: 2, align: 'end' },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'ครบกำหนด', size: 'sm', color: '#555555', flex: 2 },
              { type: 'text', text: dueText, size: 'sm', flex: 2, align: 'end' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'กรุณาชำระภายในกำหนด เพื่อหลีกเลี่ยงดอกเบี้ยผิดนัด',
            size: 'xs',
            color: '#999999',
            wrap: true,
            align: 'center',
          },
        ],
      },
    },
  };
}

module.exports = { loanReminderFlex };
