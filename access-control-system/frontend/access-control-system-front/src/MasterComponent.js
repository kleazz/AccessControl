import React, { useRef, useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "./API";

let videoRef;
let canvasRef;
let context;

function MasterComponent() {
  let [lastFrame, setLastFrame] = useState(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [showImg, setShowImg] = useState(false);
  const [heightMeasurementInProgress, setHeightMeasurementInProgress] = useState(false);
  const [showRegisterButtons, setShowRegisterButtons] = useState(false);

  function register_new_user_ok(text) {
    if (lastFrame) {
      const apiUrl = API_BASE_URL + "/register_new_user?text=" + text;
      console.log(typeof lastFrame);
      fetch(lastFrame)
        .then((response) => response.blob())
        .then((blob) => {
          const file = new File([blob], "webcam-frame.png", {
            type: "image/png",
          });
          const formData = new FormData();
          formData.append("file", file);
  
          axios
            .post(apiUrl, formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            })
            .then((response) => {
              console.log(response.data);
              if (response.data.registration_status === 200) {
                alert("User was registered successfully!");
              } else if (response.data.registration_status === 409) {
                // Assuming 409 Conflict is the status code for user already registered
                alert("User is already registered!");
              } else {
                // Handle other possible errors
                alert("An error occurred during registration. Please try again.");
              }
            })
            .catch((error) => {
              console.error("Error sending image to API:", error);
              alert("An error occurred while sending the image to the API.");
            });
        });
    }
  }
  

  async function downloadLogs() {
    const response = await axios.get(API_BASE_URL + "/get_attendance_logs", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "logs.zip");
    document.body.appendChild(link);
    link.click();
  }

  async function send_img_login() {

    const heightData = await measureHeight();
    if (!heightData || heightData.status !== 'success') {
      console.error("Height measurement failed or did not complete successfully.");
      return;
    }

    console.log("Hello");
    
    if (videoRef.current && canvasRef.current) {
      console.log("Hello from method");
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        // setLastFrame(URL.createObjectURL(blob));

        // Your edition here

        const apiUrl = API_BASE_URL + "/login";
        const file = new File([blob], "webcam-frame.png", {
          type: "image/png",
        });
        const formData = new FormData();
        formData.append("file", file);

        axios
          .post(apiUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.match_status == true) {
              alert("Welcome back " + response.data.user + " !");
            } else {
              alert("Unknown user! Please try again or register new user!");
            }
          })
          .catch((error) => {
            console.error("Error sending image to API:", error);
          });
      });
    }
  }

  async function measureHeight() {
    // Make a POST request to trigger the height measurement process
    const exUrl = API_BASE_URL + "/measure_height"; // Adjust URL as needed
    console.log("u thirra");
    try {
      const response = await axios.post(exUrl);
      console.log(response.data);
      return(response.data); // Log response from height measurement process
    } catch (error) {
      console.error("Error measuring height:", error);
      alert("Error measuring height. Please try again later.");
    }
  }

  async function send_img_logout() {
    const heightData = await measureHeight();
    if (!heightData || heightData.status !== 'success') {
      console.error("Height measurement failed or did not complete successfully.");
      return;
    }
    if (videoRef.current && canvasRef.current) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        // setLastFrame(URL.createObjectURL(blob));

        // Your edition here

        const apiUrl = API_BASE_URL + "/logout";
        const file = new File([blob], "webcam-frame.png", {
          type: "image/png",
        });
        const formData = new FormData();
        formData.append("file", file);

        axios
          .post(apiUrl, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log(response.data);
            if (response.data.match_status == true) {
              alert("Goodbye " + response.data.user + " !");
            } else {
              alert("Unknown user! Please try again or register new user!");
            }
          })
          .catch((error) => {
            console.error("Error sending image to API:", error);
          });
      });
    }
  }
  useEffect(() => {
    if (heightMeasurementInProgress) {
      // If height measurement is in progress, wait for it to complete
      measureHeight().then((heightData) => {
        if (heightData && heightData.status === 'success') {
          // If height measurement is successful, show register buttons
          setShowRegisterButtons(true);
          console.log("Register buttons: true");
        } else {
          // If height measurement fails, show error message or handle it accordingly
          console.error("Height measurement failed or did not complete successfully.");
        }
        // Height measurement is no longer in progress
        setHeightMeasurementInProgress(false);
      });
    }
  }, [heightMeasurementInProgress, showRegisterButtons]);

  return (
    <div className="master-component">
      {showWebcam ? (
        <Webcam lastFrame={lastFrame} setLastFrame={setLastFrame} />
      ) : (
        <img className="img" src={lastFrame} />
      )}
      <Buttons
        lastFrame={lastFrame}
        setLastFrame={setLastFrame}
        setShowWebcam={setShowWebcam}
        showWebcam={showWebcam}
        setShowImg={setShowImg}
        send_img_login={send_img_login}
        send_img_logout={send_img_logout}
        register_new_user_ok={register_new_user_ok}
        downloadLogs={downloadLogs}
        measureHeight={measureHeight}
        setHeightMeasurementInProgress={setHeightMeasurementInProgress}
        showRegisterButtons={showRegisterButtons}
        setShowRegisterButtons={setShowRegisterButtons}
      />
    </div>
  );
}

function saveLastFrame(
  canvasRef,
  lastFrame,
  setLastFrame,
  setShowWebcam,
  showWebcam,
  setShowImg
) {
  requestAnimationFrame(() => {
    console.log(context);

    if (!showWebcam && lastFrame) {
      setShowImg(true);
    } else {
      setShowImg(false);
    }

    if (videoRef.current && canvasRef.current) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      canvasRef.current.toBlob((blob) => {
        setLastFrame(URL.createObjectURL(blob));
        // lastFrame = blob.slice(); // Your edition here
      });
      setShowWebcam(false);
      setShowImg(true);
    }
  }, [showWebcam]);
}

// function Webcam({ lastFrame, setLastFrame }) {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [isStreaming, setIsStreaming] = useState(false);

//   useEffect(() => {
//     const setupCamera = async () => {
//       try {
//         const constraints = {
//           video: {
//             facingMode: 'user' // Use the user-facing camera (typically the internal camera)
//           }
//         };

//         const stream = await navigator.mediaDevices.getUserMedia(constraints);
//         videoRef.current.srcObject = stream;
//         setIsStreaming(true);
//       } catch (error) {
//         console.error('Error accessing user-facing camera:', error);
//       }
//     };

//     if (!isStreaming) {
//       setupCamera();
//     }
//   }, [isStreaming]);

//   useEffect(() => {
//     if (isStreaming) {
//       const context = canvasRef.current.getContext("2d");

//       const drawFrame = () => {
//         context.drawImage(videoRef.current, 0, 0, 400, 300);

//         setTimeout(() => {
//           requestAnimationFrame(drawFrame);

//           canvasRef.current.toBlob((blob) => {
//             setLastFrame(URL.createObjectURL(blob));
//             // Avoid modifying props directly: lastFrame = blob.slice();
//           });
//         }, 33);
//       };

//       drawFrame();
//     }
//   }, [isStreaming, setLastFrame]);




function Webcam({ lastFrame, setLastFrame }) {
  videoRef = useRef(null);
  canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const setupCamera = async () => {
      try {
                const constraints = {
                  video: {
                    facingMode: 'environment' 
                  }
                }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    }catch(error){
      console.error('Error accessing user-facing camera:', error);
    }
  };
    if (!isStreaming) {
      setupCamera();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 400, 300);

      requestAnimationFrame(() => {
        setTimeout(() => {
          context.drawImage(videoRef.current, 0, 0, 400, 300);

          canvasRef.current.toBlob((blob) => {
            setLastFrame(URL.createObjectURL(blob));
            lastFrame = blob.slice(); // Your edition here
          });
        }, 33);
      });
    }
  }, [isStreaming]);

  return (
    <div className="webcam">
      <canvas ref={canvasRef} width={400} height={300} />
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
}

function Buttons({
  lastFrame,
  setLastFrame,
  setShowWebcam,
  showWebcam,
  setShowImg,
  send_img_login,
  send_img_logout,
  register_new_user_ok,
  downloadLogs,
  measureHeight,
  setHeightMeasurementInProgress,
  showRegisterButtons,
  setShowRegisterButtons
}) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [zIndexAdmin, setZIndexAdmin] = useState(1);
  const [zIndexRegistering, setZIndexRegistering] = useState(1);

  const changeZIndexAdmin = (newZIndex) => {
    setZIndexAdmin(newZIndex);
  };

  const changeZIndexRegistering = (newZIndex) => {
    setZIndexRegistering(newZIndex);
  };

  const [value, setValue] = useState("");

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const resetTextBox = () => {
    setValue("");
  };

  return (
    <div className="buttons-container">
      <div
        className={`${
          isRegistering ? "visible" : "hidden"
        } register-text-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
      >
        <input
          className="register-text"
          type="text"
          placeholder="Enter user name"
          value={value}
          onChange={handleChange}
        />
      </div>
      <div
        className={`${
          showRegisterButtons ? "visible" : "hidden"
        } register-ok-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
      >
        <button
        className="register-ok-button"
          // className={`${
          //   isRegistering ? "visible" : "hidden"
          // } register-ok-button`}
          onClick={async () => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            setShowWebcam(true);
            setShowImg(false);
            
            register_new_user_ok(value);
            setShowRegisterButtons(false);
          }}
        ></button>
      </div>
      <div
        className={`${
          showRegisterButtons ? "visible" : "hidden"
        } register-cancel-container`}
        style={{
          zIndex: zIndexRegistering,
        }}
      >
        <button
        className="register-cancel-button"
          // className={`${
          //   isRegistering ? "visible" : "hidden"
          // } register-cancel-button`}
          onClick={async () => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            setShowWebcam(true);
            setShowImg(false);
            setShowRegisterButtons(false);

          }}
        ></button>
      </div>
      <div className="login-container">
        <button
          className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } login-button`}
          onClick={async () => {
            // saveFrameToDisk(canvasRef, lastFrame, setLastFrame);
            // setIsRegistering(true);
            send_img_login();
            // measureHeight();
          }}
        ></button>
      </div>
      <div className="logout-container">
        <button
          className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } logout-button`}
          onClick={() => {
            send_img_logout();
          }}
        ></button>
      </div>
      <div className="admin-container">
        <button
          className={`${
            isAdmin || isRegistering ? "hidden" : "visible"
          } admin-button`}
          onClick={() => {
            setIsAdmin(true);
            setIsRegistering(false);
            

            changeZIndexAdmin(3);
            changeZIndexRegistering(1);
          }}
        ></button>
      </div>
      <div
        className="register-container"
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`${isAdmin ? "visible" : "hidden"} register-button`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(true);

            changeZIndexAdmin(1);
            changeZIndexRegistering(3);

            // measureHeight();

            setHeightMeasurementInProgress(true);

            saveLastFrame(
              canvasRef,
              lastFrame,
              setLastFrame,
              setShowWebcam,
              showWebcam,
              setShowImg
            );
            resetTextBox();

          }}
        ></button>
      </div>
      <div
        className="goback-container"
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`${isAdmin ? "visible" : "hidden"} goback-button`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);
          }}
        ></button>
      </div>

      <div
        className="download-container"
        style={{
          zIndex: zIndexAdmin,
        }}
      >
        <button
          className={`${isAdmin ? "visible" : "hidden"} download-button`}
          onClick={() => {
            setIsAdmin(false);
            setIsRegistering(false);

            changeZIndexAdmin(1);
            changeZIndexRegistering(1);

            downloadLogs();
          }}
        ></button>
      </div>
    </div>
  );
}
export default MasterComponent;
