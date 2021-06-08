// external
import React , { useState, useEffect, useContext } from 'react'
import { useHistory } from "react-router-dom"
import axios from 'axios'

// internal
import CustomLoader from '../../components/CustomLoader/CustomLoader'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import Sidebar, { discordHashIcon } from './components/Sidebar/Sidebar'
import parseQuery from '../../utils/parseQuery'
import Controls from './components/Controls/Controls'
import SmartImage from './components/SmartImage/SmartImage'
import { getUserAvatar } from './../ServerBrowser/components/UserDisplay'

// external styles
import '@trendmicro/react-sidenav/dist/react-sidenav.css';

// icons
import sauceNaoIcon from './../../assets/images/saucenao.png'
import iqdbIcon from './../../assets/images/iqdb.png'

// styles
import './styles.scss'

// context
import { DiscordContext } from '../../App'

interface Guild {
    id? : string,
    availableChannels? : []
}

interface Channel {
    id?: string,
    name?: string,
    topic?: string,
    nsfw?: boolean
}

const ChannelBrowser = (props) => {
    const { 
        user, setUser,
        guilds, setGuilds
    } = useContext(DiscordContext)

    const { setError } = props
    const history = useHistory()

    // ...
    const [ sidebarExpanded, setSidebarExpanded ] = useState(true)
    const [ imageWidth, setImageWidth ] = useState<number>(500)
    const [ isLoading,  setIsLoading  ] = useState(false)
    
    // pagination stuff
    const [ dynamicPage , setDynamicPage ] = useState<number>(1)
    const [ pageSize, setPageSize ] = useState<number>(10)
    const [ pageNum,  setPageNum  ] = useState<number>(1)
    const [ autoLoad, setAutoLoad ] = useState<boolean>(false)
    const [ msgCount, setMsgCount ] = useState<number>(999)

    // ...
    const [ messages, setMessages ] = useState([])
    const [ channel,  setChannel  ] = useState<Channel>({})
    const [ guild,    setGuild    ] = useState<Guild>({})
    const [ users,    setUsers    ] = useState({})

    useEffect(() => {
        loaderWrap(checkURL)
    }, [] )

    useEffect(() => {
        //getAllUsersData()
    }, [messages] )

    const loaderWrap = async (wrappedFunction : any) => {
        setIsLoading(true)
        await wrappedFunction()
        setIsLoading(false)
    }
    
    const checkURL = async () => {
        const pathname = window.location.pathname.split('/')
        if (pathname[1] !== 'channels') return
        
        const gID  = pathname[2]
        if (!gID) return;
        await getGuildData(gID)

        const chID = pathname[3]
        const searchQuery : any = parseQuery(window.location.search)

        let num  = pageNum  ?? (isNaN(Number(searchQuery.p)) ? 0  : Number(searchQuery.p))
        let size = pageSize ?? (isNaN(Number(searchQuery.s)) ? 10 : Number(searchQuery.s))

        num  = Math.max(1, num) // min page number: 1 >> shift indexing by 1
        size = Math.min(100, Math.max(5, size)) // min page size: 5, max page size: 100

        const pagination = { num, size }
        console.log('pagination', pagination) // i dont actually do anything with this...

        if (!chID) return;
        await getSetMessages(gID, chID, pagination) // last prop is useless, rework later!!!
        
        setDynamicPage(num)
    }
    

    const getGuildData = async (gID) => {
        
        try {

            let _guilds = guilds

            if (_guilds.length == 0){
                const response = await axios.get('/getGuilds')
                _guilds = response.data.guilds
                setGuilds(_guilds)
                setUser(response.data.user)
            }

            const _guild = _guilds.find( g => g.id === gID)
            
            setGuild(_guild)
            //setUser(response.data.user)
        } catch (error){
            setError("Unable to get the guild.")
            history.push('/')
        }
    }

    const getSetMessages = async (gID = guild.id, chID = channel.id, pagination = { num: 1, size: 10 } ) => {
        setIsLoading(true)
        try {

            if (!gID) {
                setError("Unable to get the channel.")
                return
            }

            const url = pageNum ? `/browse/${gID}/${chID}?p=${pageNum}&s=${pageSize}` :`/browse/${gID}/${chID}`
            const response = await axios.get(url)
            const { botUser, channel : ch, channels, fixedname, messages : msgs, msgCount } = response.data
            setChannel(ch)
            setMessages(msgs)
            setMsgCount(msgCount)

            getAllUsersData(msgs)

        } catch (error){
            setError("Unable to get the channel.")
            history.push('/')
        }

        setIsLoading(false)
    }

    const getAllUsersData = async (msgs) => {

        const newUsers = JSON.parse(JSON.stringify(users))

        for (let msg of msgs){

            const userID : string = msg.author.id || msg.author
            
            if (newUsers[userID]?.id) continue;
            // idk
            console.log(`yoink @ member/${guild.id}/${userID}`)

            try {
                // try different things later!!!!
                const response = await axios.get(`member/${guild.id}/${userID}`)
    
                newUsers[userID] = {
                    ...(response.data.user.user || {}),
                    username: response.data.user.user?.username || response.data.user.username,
                    id: response.data.user.id,
                    nick: response.data.user.nick,
                    status: response.data.user.status,
                    color: response.data.user.color
                }
                
                //setUsers(newUsers)
            } catch (error){
                console.log(error)
            }
        }
        
        setUsers(newUsers)
    }

    useEffect( () => {
        checkURL()
    }, [pageNum, pageSize])

    const setPageTo = (to = pageNum) => {
        let num  = isNaN(Number(to)) ? 0 : Number(to)
        num = Math.max(1, num) // min page number: 1 >> shift indexing by 1
        
        history.push(`/channels/${guild.id}/${channel.id}?p=${num}&s=${pageSize}`)
        setPageNum(num)
        setDynamicPage(num)
        //setAutoLoad(false)
    }

    const setPageSizeTo = (to = pageSize) => {
        let size = isNaN(Number(to)) ? 10 : Number(to)
        size = Math.min(100, Math.max(5, size)) // min page size: 5, max page size: 100

        history.push(`/channels/${guild.id}/${channel.id}?p=${pageNum}&s=${size}`)
        setPageSize(size)
        setPageNum(1)
        //setAutoLoad(false)
    }

    const handleLoadMore = async (gID = guild.id, chID = channel.id) => {
        //setIsLoading(true)
        if (isLoading) return;

        try {

            if (!gID) {
                setError("Unable to get the channel.")
                return
            }
            
            const newPageNum = dynamicPage + 1
            const url = pageNum ? `/browse/${gID}/${chID}?p=${newPageNum}&s=${pageSize}` : `/browse/${gID}/${chID}`
            const response = await axios.get(url)
            
            const { messages : msgs } = response.data
            const _messages = messages.concat(msgs)
            setMessages(_messages)
            setDynamicPage(newPageNum)
            getAllUsersData(msgs)
        } catch (error){
            setError("Unable to get the channel.")
            history.push('/')
        }

        //setIsLoading(false)
    }
    const handleScroll = (e) => {
        if (!channel.id || messages.length == 0) return
        const isOnBottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
        if (isOnBottom && autoLoad) handleLoadMore()
    }

    const renderChannelHeader = () => (
        <div key={`ch-header-${channel.id}`} className="mb-20">
            
            <span className="channel-name">
                { discordHashIcon(36) }{channel.name}
                { channel.nsfw ? (
                    <span className="channel-tag nsfw">
                        NSFW
                    </span> 
                ) : (
                    <span className="channel-tag">
                        SAFE
                    </span> 
                ) }
            </span> 
            <div className="channel-topic">{channel.topic}</div>
        </div>
    )
    
    const renderLoadMoreBtn = () => {
        const isLast = (dynamicPage || pageNum) >= (Math.ceil(msgCount/pageSize))
        
        return (
            <div 
                className={`load-more-btn pointer ${isLast ? 'disabled' : ''}`}
                onClick={() => isLast ? null : handleLoadMore()}
            >
                { isLast ? (
                    <> This is the end of the <span className="ml-10 mr-10" style={{ textDecoration: 'line-through' }}>Internet</span> channel </>
                ) : (
                    <> Load {pageSize} more images... </>
                )}
            </div> 
        )
    }

    const renderImage = (msg, i) => (
        <a href={msg.url} target="_blank">
            <SmartImage 
                key={`${i}-${msg.id}`}
                loading="lazy"
                title={ msg.filename } 
                alt={ msg.filename } 
                src={ msg.url } 
                onError = { (event:any) => {
                    event.target.alt="Couldn't load the image" 
                    event.target.setAttribute('height', 0) 
                }} 
            />
        </a>
    )

    const renderVideo = (msg, i) => (
        <video 
            key={`${i}-${msg.id}`}
            loop controls 
            title={msg.filename} 
            preload="metadata" 
            onError = { (event:any) => {
                event.target.alt="Couldn't load the image" 
                event.target.setAttribute('height', 0) 
            }} 
        >
            <source src={msg.url}  type="video/mp4"></source>
        </video>
    )

    const getFormattedDate = (snowflake) => {
        const approxDate = new Date(parseInt(snowflake) / 4194304 + 1420070400000)
        const year = approxDate.getFullYear()
        const month = (approxDate.getMonth()+1).toString().padStart(2, '0')
        const day = approxDate.getDate()

        return `${day}/${month}/${year}`
    }

    const setFlagAndLoadMode = (val) => {
        setAutoLoad(val)
        handleLoadMore()
    }

    const softResetPagination = () => {
        setDynamicPage(1)
        setPageNum(1)
    }

    return (
        <div className='channel-browser-container'>
            
            {/* <Topbar/> */}
            <Sidebar 
                user={user} 
                guild={guild}
                channels={guild?.availableChannels}
                getSetMessages={getSetMessages}
                sidebarExpanded={sidebarExpanded}
                setSidebarExpanded={setSidebarExpanded}
                softResetPagination={softResetPagination}
            />

            <OverlayScrollbarsComponent
                style={{ overflow: 'auto', height: '100%', width: '100%' }}
                options={{ 
                    overflowBehavior: { x: 'scroll', y: 'scroll' },
                    scrollbars: { autoHide: 'scroll', autoHideDelay: 1000 } 
                }}
                onScrollCapture={handleScroll}
            > 

                <div className={`${ sidebarExpanded ? 'content-less' : 'content-more' } channel-content-container`}>
                    <div className="channel-header">
                        { channel.id && messages.length != 0 && <div className="controls controls-top">
                            <Controls 
                                // pagination
                                pageNum={pageNum}
                                pageSize={pageSize}
                                pageSizeShow={true}
                                autoLoad={autoLoad} 
                                setPageTo={setPageTo}
                                setAutoLoad={setAutoLoad}
                                setPageSizeTo={setPageSizeTo}

                                // artwork display
                                imageWidth={imageWidth} 
                                setImageWidth={setImageWidth}

                                // misc
                                messages={messages}
                                msgCount={msgCount}
                                showFilter={true}
                            />
                        </div> }
                        { channel.id && renderChannelHeader() }
                    </div>
                    <div className="messages-container mt-75">
                        { isLoading ? (
                            <div className='overlay-loader'>
                                <CustomLoader/>
                                <div className="mt-30">Getting { messages.length === 0 ? 'channels' : 'messages' }...</div>
                            </div>
                        ) : ( 
                            <>
                                
                                { messages.map( (msg,i) => {
                                    // ...
                                    return (
                                        <div className="message-container" key={`${i}-msg-${msg.id}-${getUserAvatar( users[msg.author.id || msg.author] || msg.author)}`} >
                                            
                                            <div className="message-author-wrapper">
                                                <SmartImage 
                                                    //key={`av-${msg.id}-${( users[msg.author.id || msg.author] || msg.author).avatar}`}  
                                                    //key={users[msg.author.id || msg.author]?.username}
                                                    className="chatlog__author-avatar" 
                                                    src={ getUserAvatar( users[msg.author.id || msg.author] || msg.author) } 
                                                    alt='' // default avatar here? turn it into component later?
                                                />
                                            </div>

                                            <div className="msg-am-wrapper">

                                                <div className="username-timestamp-pair">
                                                    <span className="pointer" title="Filter media by this user" > 
                                                        <div key={`${users[msg.author.id || msg.author]?.username}-${i}`} style={{ color: users[msg.author.id || msg.author]?.color || msg.author.color }}>
                                                            { users[msg.author.id || msg.author]?.username || msg.author.id || msg.author }
                                                            { (users[msg.author.id || msg.author]?.nick || msg.author.nick) && ` (${users[msg.author.id || msg.author]?.nick || msg.author.nick})`}
                                                        </div>
                                                    </span>
                                                    <span className="chatlog__timestamp">{getFormattedDate(msg.id)}</span>
                                                </div>
                                                <div className="msg-media-wrapper">
                                                    <div className="artwork-container" style={{ maxWidth: imageWidth }}>
                                                        
                                                        { msg.url.toLowerCase().includes('.mp4') ? (
                                                            renderVideo(msg, i)
                                                        ) : (
                                                            renderImage(msg, i) 
                                                        ) }
                                                    </div>
                                                    
                                                    <div className="sauce-container">
                                                        <a href={`https://iqdb.org/?url=${msg.url}`} target="_blank">
                                                            <div className="sauce">
                                                                <img className="sauce-img" src={iqdbIcon}/>
                                                                <div className="sauce-txt">IQDB</div>
                                                            </div>
                                                        </a>
                                                        <a href={`https://saucenao.com/search.php?url=${msg.url}`} target="_blank">
                                                            <div className="sauce">
                                                                <img className="sauce-img" src={sauceNaoIcon}/>
                                                                <div className="sauce-txt">SauceNAO</div>
                                                            </div>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }) }

                                <div className="controls controls-bottom mt-50">
                                { channel.id && messages.length != 0 && (
                                    <>
                                        <Controls 
                                            // pagination
                                            pageNum={pageNum}
                                            pageSize={pageSize}
                                            setPageTo={setPageTo}
                                            setAutoLoad={setFlagAndLoadMode}

                                            // misc
                                            messages={messages}
                                            msgCount={msgCount}
                                        />

                                        { renderLoadMoreBtn() }
                                        
                                    </>
                                )}
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </OverlayScrollbarsComponent>
        </div>
    )
}

export default ChannelBrowser