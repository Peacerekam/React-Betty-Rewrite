
// style
import 'rc-slider/assets/index.css'

// internal
import React, { useState, useEffect } from 'react'
import Slider, { SliderTooltip } from 'rc-slider'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

// const { createSliderWithTooltip } = Slider
// const Range = createSliderWithTooltip(Slider.Range)
const { Handle } = Slider

const Controls = (props) => {
    const { 
        pageNum,   pageSize,      autoLoad,    imageWidth,    messages,   msgCount, pageSizeShow, className, showFilter,
        setPageTo, setPageSizeTo, setAutoLoad, setImageWidth
    } = props

    const lastPage = Math.ceil(msgCount / pageSize)

    const handle = props => {
        const { value, dragging, index, ...restProps } = props
        setImageWidth(value)

        return (
            <SliderTooltip
                prefixCls="rc-slider-tooltip"
                overlay={`${value} px`}
                visible={dragging}
                placement="top"
                key={index}
            >
                <Handle value={value} {...restProps} />
            </SliderTooltip>
        )
    }

    const getPageRange = () => {
        const arr = []
        const range = 3
        const endOffset = (range*2)+2

        const isCloseToEnd   = pageNum + range + 1 > lastPage
        const isCloseToStart = pageNum - range < 1

        let nStart = isCloseToStart ? 1 : pageNum - range
        let nEnd  = pageNum + endOffset

        if (isCloseToEnd){
            nEnd   = lastPage
            nStart = lastPage - endOffset + 1
            if (nStart < 0) nStart = 1
        }

        if (nStart != 1) arr.push(1)

        for (let i = nStart; i < nEnd; i++){
            if (i <= 0) continue;
            if (i >= lastPage) break;
            if (arr.length >= (range*2)+2) break;
            arr.push(i)
        }

        arr.push(lastPage)

        return arr
    }

    const renderPagination = () => (
        <>
            <div className={`pagination-container ${className || ''}`}>
                <div className="pagination">

                    <button className="mr-10 previous-btn" disabled={!messages.length || pageNum <= 1} onClick={ () => setPageTo(pageNum - 1) }>
                        <FontAwesomeIcon className="mr-5" icon={faChevronLeft} size="1x"/> Back
                    </button>

                    { getPageRange().map( (n,i) => {
                        const isFirst = n == 1
                        const isLast  = n == lastPage
                        return (
                            <span key={`${n}-${i}`} className='number-btn-container'>
                                <span className={`number-btn-tooltip ${n == pageNum ? 'current-page' : ''}`}>
                                    { isFirst ? 'first' : ''}
                                    { isLast  ? 'last'  : ''}
                                </span>
                                <button 
                                    key={`num-btn-${n}-${i}`}
                                    disabled={!messages.length}
                                    onClick={ () => setPageTo(n) }
                                    className={`${n == pageNum ? 'current-page' : ''} numbers ${isFirst ? 'first-number' : ''} ${isLast ? 'last-number' : ''}`}
                                >
                                    {n}
                                </button>
                            </span>
                        )
                    })}
                    
                    <button className="ml-10 next-btn" disabled={!messages.length || pageNum >= lastPage} onClick={ () => setPageTo(pageNum + 1) }>
                        Next <FontAwesomeIcon className="ml-5" icon={faChevronRight} size="1x"/>
                    </button>

                </div>
            </div>
        </>
    )

    const renderSlider = () => (
        <div className="labeled slider-wrapper mt-10">
            <label>Preview width</label>
            <Slider min={100} max={2000} defaultValue={imageWidth} handle={handle} />
        </div>
    )

    const renderSelector = () => (
        <div className="labeled mt-10">
            <label>Page size</label>
            <select style={{width: '200px'}} defaultValue={pageSize} onChange={ event => setPageSizeTo(Number(event.target.value)) }>
                { [5,10,25,50,100].map( n => <option value={n}>{n}</option> ) }
            </select>
        </div>
    )

    const renderAutoLoad = () => (
        <div className="labeled mt-10">
            <label>Auto load</label>
            <input checked={autoLoad} onChange={ (event) => setAutoLoad(event.target.checked)} type="checkbox"/>
        </div>
    )

    const renderFilter = () => (
        <div className="labeled mt-10">
            <label>Filter by User</label>
            <input type="text"/>
        </div>
    )

    return (
        <>
            { showFilter   != undefined && renderFilter()      }
            { pageSizeShow != undefined && renderSelector()    }
            { imageWidth   != undefined && renderSlider()      }
            { autoLoad     != undefined && renderAutoLoad()    }
            { pageNum      != undefined && renderPagination()  }

        </>
    )
}

export default Controls