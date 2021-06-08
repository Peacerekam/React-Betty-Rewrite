// external
import React, { useState, useEffect } from 'react'
import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useHistory } from "react-router-dom"

// internal
import { getUserAvatar, defaultAv } from '../../../ServerBrowser/components/UserDisplay'
export const discordHashIcon = (px) => <svg width={`${px}`} height={`${px}`} viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z"></path></svg> 

interface Tooltip {
    name: string,
    img: string,
    y: number
}

const Sidebar = (props) => {
    const { channels, user, guild, getSetMessages, sidebarExpanded, setSidebarExpanded, softResetPagination } = props
    const [ tooltip, setTooltip ] = useState<Tooltip>({name:'', y: -1, img: ''})
    const [ currChannel, setCurrChannel ] = useState('')
    const history = useHistory()
    
    useEffect( () => {
        const p = window.location.pathname.split('/')
        if (p.length === 1 || p.length > 4) return
        setCurrChannel( p[3] )
    },[])

    const handleSelect = (selected) => {
        const to = selected === "/" ? "/" : `/channels/${guild.id}/${selected}`

        if (to == "/") {
            // setGuilds([]); setUser({}); // ...
        } else {
            if (window.location.pathname === to || !to.startsWith('/channels/')) return
            setCurrChannel(selected)
            getSetMessages(guild.id, selected)
            // this seems more annoying than helpful tbh
            //if (sidebarExpanded) setTimeout( () => setSidebarExpanded(false), 1)
        }

        history.push(to)
        softResetPagination()
    }

    const updateTooltip = ( tooltip : Tooltip) => {
        const y = tooltip.y - 15
        setTooltip({ ...tooltip, y })
    }

    return (
        <div className="sidebar"> 

            { !sidebarExpanded && tooltip.name !== '' && (
                <div style={{top: tooltip.y}} className="channel-tooltip">
                    <div className="tooltip-arrow"></div>
                    <div className="tooltip-text"># {tooltip.name}</div>
                    <div className="tooltip-preview">
                        <img 
                            src={ tooltip.img }  
                            onError={ (event : any) => {
                                event.target.onerror = null
                                event.target.src = defaultAv.default
                            }} 
                        />
                    </div>
                </div> 
            )}

            <SideNav
                expanded={ sidebarExpanded }
                onToggle={ setSidebarExpanded }
                onSelect={(selected) => { 
                    // this breaks due to NavItems being wrapped within OverlayScrollbarsComponent, 
                    // so i handle it with onClicks instead
                }}
            >
                
                <SideNav.Toggle />
                
                <OverlayScrollbarsComponent
                    style={{ overflow: 'auto', height: '100%', width: '100%' }}
                    options={{ 
                        overflowBehavior: { x: 'hidden', y: 'scroll' },
                        scrollbars: { autoHide: 'scroll', autoHideDelay: 200 } 
                    }} 
                > 
                    <SideNav.Nav defaultSelected="">

                        { channels && channels.map( (ch,i) => (
                            <NavItem 
                                navitemClassName={`${currChannel === ch.id ? "current-channel-sidebar" : "hoverable-sidebar" }`} 
                                key={`nav-${ch.id}-${i}`} 
                                eventKey={ch.id} 
                                onClick={ () => handleSelect(ch.id)}
                            >
                                <NavIcon 
                                    onMouseMove ={ (event) => updateTooltip({ name: ch.name, y: event.clientY, img: ch.lastImageUrl}) }
                                    onMouseLeave={ () => updateTooltip({name:'', y: -1, img: ''}) }
                                >
                                    <div className="circle-fit">
                                        <img 
                                            src={ ch.lastImageUrl }  
                                            onError={ (event : any) => {
                                                event.target.onerror = null
                                                event.target.src = defaultAv.default
                                            }} 
                                        />
                                    </div>
                                </NavIcon>
                                <NavText>
                                    <div className={`${sidebarExpanded ? '' : 'hidden-sidebar' } sidebar-nav-opt-container`}>
                                        <div className="sidebar-nav-text">
                                            { discordHashIcon(24) }
                                            {ch.name}
                                        </div>
                                    </div>
                                </NavText>
                            </NavItem>
                        )) } 
                        
                        { user.id && (
                            <>
                                <div className="spacer-line mt-10 mb-10"></div>
                                <NavItem navitemClassName="hoverable-sidebar mb-20" eventKey="" onClick={() => handleSelect("/")}>
                                    <NavIcon>
                                        <div className="circle-fit">
                                            <img src={ getUserAvatar(user) } />
                                        </div>
                                    </NavIcon>
                                    <NavText>
                                        <div className="sidebar-nav-opt-container">
                                            <div className="sidebar-nav-text">
                                                Log out
                                            </div>
                                        </div>
                                    </NavText>
                                </NavItem>
                            </>
                        ) }

                    </SideNav.Nav>
                    
                </OverlayScrollbarsComponent>
            </SideNav>
        </div>
    )
}

export default Sidebar