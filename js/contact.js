// Contact page: phone number and email from the `contact` section of site.yaml.
Elegant.boot(function (data) {
  var contact = data.contact;

  if (contact.title) {
    document.getElementById("contact-title").textContent = contact.title;
  }
  document.getElementById("contact-text").textContent = contact.text || "";

  if (contact.phone) {
    var phone = document.getElementById("contact-phone");
    // tel: links need the number without spaces or punctuation (keep a leading +).
    phone.href = "tel:" + String(contact.phone).replace(/[^\d+]/g, "");
    phone.textContent = contact.phone;
    document.getElementById("contact-phone-card").hidden = false;
  }

  if (contact.email) {
    var email = document.getElementById("contact-email");
    email.href = "mailto:" + contact.email;
    email.textContent = contact.email;
    document.getElementById("contact-email-card").hidden = false;
  }
});
