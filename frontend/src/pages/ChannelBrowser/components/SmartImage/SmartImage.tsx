import React, { useEffect, createRef, useRef } from 'react'

// if you change pages fast the browser will still try to load
// previous page's images even when they are removed from the DOM
// unless their src is reseted (it may not work on all browsers)
// doesnt seem to work quite as well as i hoped so ill have to look into it later

const SmartImage = (props) => {
    let imgRef = useRef(null)
    
    useEffect( () => {

        return () => {
            try {
                imgRef.current.src = ''
                imgRef.current.onerror = null
                delete imgRef.current.src
            } catch (e) { }
        }
        
    }, [])

    return <img {...props} ref={imgRef} />
}

export default SmartImage