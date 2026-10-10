import csv
import smtplib
from email.message import EmailMessage

# Configuration Settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465  # Using SSL
SENDER_EMAIL = "your_municipality_email@gmail.com"
SENDER_PASSWORD = "your_app_password_here"  # Use an App Password, not your raw account password


def send_ward_alert(subject, message_body, csv_file="residents.csv"):
  # Load recipient list
  try:
    with open(csv_file, mode="r", encoding="utf-8") as file:
      reader = csv.DictReader(file)
      residents = list(reader)
  except FileNotFoundError:
    print(f"Error: Could not find {csv_file}")
    return

  if not residents:
    print("No residents found in the CSV file.")
    return

  # Establish secure connection with the SMTP server
  try:
    print("Connecting to mail server...")
    server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
    server.login(SENDER_EMAIL, SENDER_PASSWORD)

    success_count = 0
    for resident in residents:
      name = resident["name"]
      email = resident["email"]

      # Personalize message
      msg = EmailMessage()
      msg["Subject"] = subject
      msg["From"] = SENDER_EMAIL
      msg["To"] = email

      personalized_body = f"Dear {name},\n\n{message_body}\n\nRegards,\nWard Office Administration"
      msg.set_content(personalized_body)

      # Send email
      server.send_message(msg)
      print(f"Alert sent successfully to: {email}")
      success_count += 1

    server.quit()
    print(
        f"\nBroadcast completed! Successfully sent {success_count} out of"
        f" {len(residents)} alerts."
    )

  except Exception as e:
    print(f"An error occurred while sending emails: {e}")


if __name__ == "__main__":
  # Example Usage for a Water Cut Notice
  alert_subject = "URGENT: Scheduled Water Supply Interruption in Your Ward"
  alert_message = (
      "Please be advised that there will be a temporary water cut in your"
      " area on Monday, October 12, from 10:00 AM to 4:00 PM due to pipeline"
      " maintenance work. Kindly store sufficient water in advance. We regret"
      " the inconvenience caused."
  )

  send_ward_alert(alert_subject, alert_message)
