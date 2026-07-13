if (event.type === "message" && event.message.type === "text") {

    const msg = event.message.text.trim();

    if (msg === "บริการ") {
        return client.replyMessage(event.replyToken, serviceFlex());
    }

}
function serviceFlex() {
    return {
        type: "flex",
        altText: "บริการของสหกรณ์",
        contents: {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                spacing: "md",
                contents: [

                    {
                        type: "text",
                        text: "บริการของสหกรณ์",
                        weight: "bold",
                        size: "xl",
                        color: "#FFFFFF",
                        align: "center",
                        backgroundColor: "#0066CC",
                        paddingAll: "12px"
                    },

                    createButton("💰 บริการด้านเงินกู้", "loan"),

                    createButton("🐷 บริการด้านเงินฝาก", "deposit"),

                    createButton("🎁 สวัสดิการสงเคราะห์สมาชิก", "welfare"),

                    createButton("📞 ช่องทางการติดต่อ", "contact")

                ]
            }
        }
    };
}
function createButton(text, data) {

    return {
        type: "button",
        style: "primary",
        color: "#FF1493",
        action: {
            type: "postback",
            label: text,
            data: data,
            displayText: text
        }
    };

}
if (event.type === "postback") {

    switch (event.postback.data) {

        case "loan":
            return client.replyMessage(event.replyToken, {
                type: "text",
                text: "คุณเลือกเมนูบริการด้านเงินกู้"
            });

        case "deposit":
            return client.replyMessage(event.replyToken, {
                type: "text",
                text: "คุณเลือกเมนูบริการด้านเงินฝาก"
            });

        case "welfare":
            return client.replyMessage(event.replyToken, {
                type: "text",
                text: "คุณเลือกเมนูสวัสดิการสงเคราะห์สมาชิก"
            });

        case "contact":
            return client.replyMessage(event.replyToken, {
                type: "text",
                text: "คุณเลือกเมนูช่องทางการติดต่อ"
            });

    }

}