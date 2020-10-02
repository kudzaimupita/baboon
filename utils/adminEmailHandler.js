const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class AdminEmail {
  constructor(user = '', plug = '') {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.adminEmail = user.email;
    this.adminName = user.name;
    this.newPlugName = plug.newPlug.name;
    this.newPlugEmail = plug.newPlug.companyEmail;
    this.newPlugId = plug.newPlug._id;
    this.newPlugUrl = plug.url;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '110402b2f4e674',
        pass: '452ec654ab9bd2'
      }
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      adminName: this.adminName,
      newPlugEmail: this.newPlugEmail,
      newPlugName: this.newPlugName,
      newPlugId: this.newPlugId,
      newPlugUrl: this.newPlugUrl
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendAdminPlugApplication() {
    await this.send('plugApplication', ` Plug application!`);
  }
};
