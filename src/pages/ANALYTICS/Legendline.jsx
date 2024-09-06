import React from "react";
const Legendline =({color})=>{
    return(
        <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 1H12" stroke={color}/>
        </svg>

    )

}
export default Legendline;