import React from "react";
import { useEffect, useRef, useState } from "react";
import { Box, Button } from "theme-ui";
import { Divider,Fade,Text } from "@chakra-ui/react";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Axios from "axios";
import { useDisclosure } from "@chakra-ui/react";
import { useRolliq } from "../../hooks/RolliqContext";
import { Spinner } from "theme-ui";
import ResultDialog from "./ResultDialog";

const Faucet = () => {
  const [token, setToken] = useState(null);
  const [isCaptchaOpen,setIsCaptchaOpen]=useState(false);
  const [isSuccess,setIsSuccess]=useState(false);
  const [isLoading,setIsLoading] = useState(true);
  const { isOpen , onOpen, onClose } = useDisclosure();

  const captchaRef = useRef(null);
  const {account} = useRolliq();
  // console.log(account);

  const onLoad = () => {
    setIsLoading(false);
    captchaRef.current.execute();
  };
  useEffect(() => {

    if (token)
    {
      // console.log(`hCaptcha Token: ${token}`);
      Axios.post( "http://157.230.38.174:3001/api/faucet", {
        token,
        address:account
    })
        .then(resp => {
          setIsSuccess(true);
          onOpen();
        })
        .catch(({ response }) => {
          setIsSuccess(false);
          onOpen();
        })
        .finally(() => {
            captcha.current.resetCaptcha();
            setToken("");
        });
    }

  }, [token]);
  return (
    <>
    <Fade in={true}>
    <Box className="py-8 ">
      <Box className="block justify-center flex">
        <Box className="bg-[#fff] p-8 min-[500px]:w-[392px]" style={{borderRadius: "48px"}}>
        <Text className="text-2xl font-bold text-[#1E2185]">Faucet</Text>
        <Divider className="mt-6" color="#E5E7EB" border="1px solid"/>
        <Text className="my-6">Get 0.01 ETH to try out Rolliq</Text>
        <button className="w-full bg-[#1E2185] py-2 mb-4 text-[#fff] animationCustom" style={{borderRadius:"100px",textAlign:"center",fontSize:"18px"}} onClick={()=>setIsCaptchaOpen(true)}>
          Get 0.01 ETH
        </button>
        { isCaptchaOpen&&isLoading&&
          <Box className="flex justify-center items-center">
         
          <Spinner></Spinner>
          </Box>
          
        }
        { isCaptchaOpen&&
        <Box className="flex justify-center items-center" style={{display:isLoading?"none":"flex"}}>
        <HCaptcha
         sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}
         onVerify={setToken}
         onLoad={onLoad}
         ref={captchaRef}
         onExpire={()=>setToken("")}
         reCaptchaCompat={false}
        />
        </Box> }
  
    </Box>
      </Box>

      </Box>
      <ResultDialog isOpen={isOpen} onClose={onClose} isSuccess={isSuccess}></ResultDialog>
      </Fade>
      </>
  );
  
}

export default Faucet;