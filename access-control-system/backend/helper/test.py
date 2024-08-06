import os
import pickle

pickle_file = 'rrrrrrr.pickle'

def read_height_data():
    try:
        # Change directory to 'db'
        os.chdir('db')
        
        with open(pickle_file, 'rb') as f:
            height_data = pickle.load(f)
            print("Height data from height_data.pickle:")
            print(height_data)
    except FileNotFoundError:
        print("Error: height_data.pickle file not found.")

if __name__ == "__main__":
    read_height_data()
