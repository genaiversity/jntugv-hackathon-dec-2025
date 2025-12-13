import csv
import sys
from .sms_agent import SmsSpamAgent

agent = SmsSpamAgent()

infile, outfile = sys.argv[1], sys.argv[2]

with open(infile) as f, open(outfile, "w", newline="") as o:
    reader = csv.DictReader(f)
    writer = csv.DictWriter(o, fieldnames=reader.fieldnames + ["prediction"])
    writer.writeheader()

    for row in reader:
        result = agent.predict(row["text"])
        row["prediction"] = result
        writer.writerow(row)
