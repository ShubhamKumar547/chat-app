import React, { useEffect, useState } from "react";
import styles from "./Userguide.module.css";

const GuidePopup = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(props.value);
    // console.log(props);
  }, [props]);

  const handleClose = () => {
    setIsOpen(false);
    props.updateFn(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContainer}>
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>
        <h2>Welcome to Chat App SOC</h2>
        <div className={styles.guideContent}>
          <h3>Getting Started Guide</h3>

          <div className={styles.guideSection}>
            <h4>Purpose and Speciality</h4>
            <ul>
              <li>
                <strong>
                  Please try to use in the desktop as it work upto it's full
                  potential in it
                </strong>
              </li>
              <li>
                For the mobiles the connection get broken and you need to
                re-register if 1. The mobile closes OR 2. User moves to the
                different app and again comes back. 3. Reloads the app
              </li>
              <li>
                This website enables the user to talk privately to anyone in the
                world without any government or third party data interference
                using the <strong>STRONG AES STANDARD SECURITY</strong> that no
                one can decrypt it.Also this website do not use any database to
                store messages which makes it even more suitable for talking
                privately.
              </li>
              <li>
                ** This website does not store any data of the user not even the
                ip address.
              </li>
            </ul>

            <h4>User Registration Process</h4>
            <ul>
              <li>
                Wait until the site shows connected When the website shows
                connected proceed furthur.
              </li>
              <li>
                Enter some <strong>unique</strong> Your Username that no one
                could guess it
              </li>
              <li>
                Enter the <strong>Recipient Username</strong> to whom you want
                to talk
              </li>
              <li>
                Both the{" "}
                <strong>users should be online at the same time</strong> as this
                website does not stores the data anywhere in the complete data
                transfer process.
              </li>
              <li>
                Now click Register user.(you can also register for the site
                after just entering Your Username but now you could only recieve
                messages not send to anyone.)
              </li>
            </ul>
          </div>

          <div className={styles.guideSection}>
            <h4>Messages</h4>
            <ul>
              <li>
                After the user registration start messaging without any problem.
                when you need to talk to other person just change the reciever
                username nothing else and start chatting
              </li>
            </ul>
          </div>
        </div>

        <button className={styles.gotItButton} onClick={handleClose}>
          Got it
        </button>
      </div>
    </div>
  );
};

export default GuidePopup;
