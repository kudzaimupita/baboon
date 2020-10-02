const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user = '', url = '', inquiry = '', plug = '') {
    // eslint-disable-next-line no-console
    console.log(inquiry);
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Kudzai Mupita <${process.env.EMAIL_FROM}>`;
    this.inquiryMessage = inquiry.inquiryMessage;
    this.username = inquiry.username;
    this.userEmail = inquiry.userEmail;
    this.plugName = plug.name;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'smtp.pepipost.com',
        port:25,
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
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      inquiryMessage: this.inquiryMessage,
      userEmail: this.userEmail,
      username: this.username,
      plugName: this.plugName,
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

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Baboon');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Plugs password reset!');
  }

  async sendToAdminUserInquiry() {
    await this.send('userInquiry', 'User inquiry!');
  }

  async sendFarewellToUser() {
    await this.send('farewell', 'Is this goodbye?');
  }

  async sendWelcomeToPlug() {
    await this.send('welcomePlug', `${this.plugName} has been approved ;)`);
  }

  async sendAdminPlugApplication() {
    await this.send('plugApplication', ` Plug application!`);
  }
};
