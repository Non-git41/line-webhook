// Flex Message แสดงข้อมูลสมาชิก พร้อมเงินฝาก/เงินกู้
function row(label, value, valueColor = '#111111', bold = false) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#555555', size: 'sm', flex: 2 },
      {
        type: 'text',
        text: value,
        color: valueColor,
        size: 'sm',
        flex: 3,
        align: 'end',
        ...(bold && { weight: 'bold' }),
      },
    ],
  };
}

function money(num) {
  return Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' บาท';
}

function userInfoFlex(user, saving, loan) {
  const body = [
    {
      type: 'text',
      text: 'ข้อมูลสมาชิก',
      weight: 'bold',
      color: '#105abe',
      size: 'sm',
    },
    {
      type: 'text',
      text: user.name,
      weight: 'bold',
      size: 'xxl',
      margin: 'md',
      wrap: true,
    },
    { type: 'separator', margin: 'md' },
    {
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      spacing: 'sm',
      contents: [row('เลขสมาชิก', user.member_id)],
    },
  ];

  // ── ส่วนเงินฝาก (แสดงเฉพาะถ้ามีข้อมูล) ──
  if (saving) {
    body.push(
      { type: 'separator', margin: 'lg' },
      {
        type: 'text',
        text: 'เงินฝาก',
        weight: 'bold',
        color: '#105abe',
        size: 'sm',
        margin: 'lg',
      },
      {
        type: 'box',
        layout: 'vertical',
        margin: 'md',
        spacing: 'sm',
        contents: [
          row('เลขบัญชี', saving.account_no),
          row('ยอดคงเหลือ', money(saving.balance), '#0a8a4a', true),
        ],
      }
    );
  }

  // ── ส่วนเงินกู้ (แสดงเฉพาะถ้ามีข้อมูล) ──
  if (loan) {
    const dueText = loan.due_date
      ? new Date(loan.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
      : '-';
    body.push(
      { type: 'separator', margin: 'lg' },
      {
        type: 'text',
        text: 'เงินกู้',
        weight: 'bold',
        color: '#105abe',
        size: 'sm',
        margin: 'lg',
      },
      {
        type: 'box',
        layout: 'vertical',
        margin: 'md',
        spacing: 'sm',
        contents: [
          row('เลขสัญญา', loan.loan_no),
          row('ยอดคงเหลือ', money(loan.remaining), '#c0392b', true),
          row('ค่างวด/เดือน', money(loan.monthly_payment)),
          row('ครบกำหนดงวดถัดไป', dueText),
        ],
      }
    );
  }

  body.push(
    { type: 'separator', margin: 'lg' },
    {
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      contents: [row('สถานะ', 'สมาชิกปกติ', '#105abe', true)],
    }
  );

  return {
    type: 'flex',
    altText: 'ข้อมูลสมาชิก',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: body,
      },
    },
  };
}

module.exports = { userInfoFlex };
