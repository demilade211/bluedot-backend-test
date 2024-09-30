import dotenv from "dotenv";
const { MailtrapClient } = require("mailtrap");

dotenv.config({ path: "config/config.env" });


const sendEmail = async (options) => {




  const TOKEN = "0845e7c9476b37c21936e2785e12855c";
  const ENDPOINT = "https://send.api.mailtrap.io/";

  const client = new MailtrapClient({ endpoint: ENDPOINT, token: TOKEN });

  const sender = { email: "noreply@spinelhub.com", name: options.name, };

  await client.send({
    from: sender,
    to: [{ email: options.email }],
    template_uuid: options.template_uuid,
    template_variables: options.template_variables
  })

}

export default sendEmail;