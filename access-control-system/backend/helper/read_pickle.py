import pickle
import os

def read_pickle_file(filepath):
    # Check if the file exists
    if not os.path.exists(filepath):
        print(f"The file {filepath} does not exist.")
        return

    # Open the pickle file and load the data
    with open(filepath, 'rb') as file:
        data = pickle.load(file)
    
    # Print the data to the console
    print(data)

if __name__ == "__main__":
    # Define the path to the pickle file
    pickle_file_path = os.path.join('db', 'suzi.pickle')
    
    # Read and print the pickle file data
    read_pickle_file(pickle_file_path)