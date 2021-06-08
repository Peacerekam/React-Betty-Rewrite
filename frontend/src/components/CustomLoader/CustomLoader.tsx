// external
import React, { useState, useEffect } from 'react'
import Loader from "react-loader-spinner"

const CustomLoader = (props) => {
    const [ type, setType ] : any = useState('BallTriangle')

    // why? because i can't decide which one lol
    const getRandomLoaderType = () => {
        const loaders : any = [ 'BallTriangle', 'Bars', 'Circles', 'Grid', 'Oval', 'Puff', 'Rings', 'TailSpin', 'ThreeDots', 'RevolvingDot' ]
        const index = Math.floor(Math.random() * loaders.length)
        return loaders[index]
    }

    useEffect(() => {
        const randomLoader = getRandomLoaderType()
        setType(randomLoader)
    },[])

    return (
        type ? (
            <Loader
                type   = { props.type   || type }
                color  = { props.color  || "#dc9c30" }
                height = { props.height || 100 }
                width  = { props.width  || 100 }
            />
        ) : <></>
    )
}

export default CustomLoader