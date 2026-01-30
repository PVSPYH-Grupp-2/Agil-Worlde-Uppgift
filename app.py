import os
from flask import Flask, render_template



environment = os.getenv("FLASK_DEBUG")



app = Flask(__name__)

@app.route("/")
def home():
    pass
    
    return render_template("index.html")





if __name__ == "__main__":
    app.run(debug=True)