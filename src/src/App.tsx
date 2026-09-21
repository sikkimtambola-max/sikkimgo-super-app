import React, { useState, useEffect, useRef } from 'react'

type RedeemCode = { code:string, amount:number, expiry:string, usesLeft:number, usedBy:string[] }
type ChatMsg = { id:string, user:string, text:string, time:number, isAdmin?:boolean }

export default function App(){
  const [view,setView]=useState<'user'|'wallet'|'chat'|'admin'>('user')
  const [coins,setCoins]=useState(()=>Number(localStorage.getItem('sg_coins')||'50'))
  const [userId]=useState(()=>localStorage.getItem('sg_uid')||'user_'+Math.random().toString(36).slice(2,7))
  const [redeemInput,setRedeemInput]=useState('')
  const [redeemCodes,setRedeemCodes]=useState<RedeemCode[]>(()=>{
    const s=localStorage.getItem('sg_redeems')
    return s?JSON.parse(s):[
      {code:'SIKKIM100',amount:100,expiry:'2026-12-31',usesLeft:100,usedBy:[]},
      {code:'WELCOME50',amount:50,expiry:'2026-12-31',usesLeft:500,usedBy:[]},
      {code:'GOLD500',amount:500,expiry:'2026-10-31',usesLeft:10,usedBy:[]},
    ]
  })
  const [chat,setChat]=useState<ChatMsg[]>(()=>JSON.parse(localStorage.getItem('sg_chat')||'[]'))
  const [chatInput,setChatInput]=useState('')
  const [isAdmin,setIsAdmin]=useState(localStorage.getItem('sg_isAdmin')==='1')
  const [adminPass,setAdminPass]=useState('')
  const [adminChatInput,setAdminChatInput]=useState('')
  const [gameStatus,setGameStatus]=useState('BUYING - 5:00 left')
  const [timeLeft,setTimeLeft]=useState(300)
  const [phase,setPhase]=useState<'BUY'|'PLAY'|'GAP'>('BUY')
  const chatRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{localStorage.setItem('sg_uid',userId)},[userId])
  useEffect(()=>{localStorage.setItem('sg_coins',String(coins))},[coins])
  useEffect(()=>{localStorage.setItem('sg_redeems',JSON.stringify(redeemCodes))},[redeemCodes])
  useEffect(()=>{localStorage.setItem('sg_chat',JSON.stringify(chat))},[chat])

  useEffect(()=>{
    const id=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){
          if(phase==='BUY'){setPhase('PLAY');setGameStatus('GAME LIVE - Calling...');return 15*60}
          if(phase==='PLAY'){setPhase('GAP');setGameStatus('Result - Next in 5 min');return 5*60}
          setPhase('BUY');setGameStatus('BUYING - 5:00 left');return 5*60
        }
        const m=Math.floor((t-1)/60), s=(t-1)%60
        if(phase==='BUY') setGameStatus(`BUYING - ${m}:${String(s).padStart(2,'0')} left`)
        else if(phase==='PLAY') setGameStatus(`GAME LIVE - ${m}:${String(s).padStart(2,'0')}`)
        else setGameStatus(`GAP - ${m}:${String(s).padStart(2,'0')}`)
        return t-1
      })
      const now=Date.now()
      setChat(c=>c.filter(msg=> msg.isAdmin? (now-msg.time<7*24*3600*1000):(now-msg.time<24*3600*1000)))
    },1000)
    return ()=>clearInterval(id)
  },[phase])

  useEffect(()=>{chatRef.current?.scrollTo(0,chatRef.current.scrollHeight)},[chat])

  const handleRedeem=()=>{
    const code=redeemInput.trim().toUpperCase()
    const idx=redeemCodes.findIndex(r=>r.code===code)
    if(idx===-1) return alert('Invalid Code')
    const rc=redeemCodes[idx]
    if(new Date(rc.expiry)<new Date()) return alert('Expired: '+rc.expiry)
    if(rc.usesLeft<=0) return alert('Uses finished')
    if(rc.usedBy.includes(userId)) return alert('You already used this - 1 user 1 use only')
    setCoins(c=>c+rc.amount)
    const up=[...redeemCodes]
    up[idx]={...rc,usesLeft:rc.usesLeft-1,usedBy:[...rc.usedBy,userId]}
    setRedeemCodes(up);setRedeemInput('');alert(`Success! +${rc.amount} coins`)
  }

  const sendChat=(isAdminMsg=false)=>{
    const txt=isAdminMsg?adminChatInput:chatInput
    if(!txt.trim()) return
    setChat(c=>[...c,{id:Date.now().toString(),user:isAdminMsg?'👑 Admin - SikkimGo Official':userId,text:txt,time:Date.now(),isAdmin:isAdminMsg}])
    if(isAdminMsg) setAdminChatInput(''); else setChatInput('')
  }

  return <div style={{maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'#0f172a',color:'white',paddingBottom:80}}>
    <div style={{background:'#1e293b',padding:12,display:'flex',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
      <b style={{color:'#facc15'}}>🎲 SikkimGo Super App</b><span style={{background:'#22c55e',padding:'4px 8px',borderRadius:12,fontSize:12}}>{coins} Coins</span>
    </div>
    <div style={{padding:12,background:'#1e293b',margin:8,borderRadius:12,textAlign:'center'}}>
      <div style={{fontSize:14,color:'#facc15'}}>{gameStatus}</div>
      <div style={{fontSize:11,opacity:0.6,marginTop:4}}>Corners 2 | First7 2 | Top 3 | Mid 2 | Bot 3 | FH 1 | Wrong=Block | Auto 24x7</div>
    </div>

    {view==='wallet' && <div style={{padding:12}}>
      <h3>Wallet - {userId}</h3>
      <div style={{background:'#1e293b',padding:12,borderRadius:12}}>
        <div style={{fontSize:32,color:'#22c55e'}}>{coins} Coins</div>
        <div style={{fontSize:12,opacity:0.7}}>50 Free on Signup ✓</div>
        <div style={{marginTop:16,borderTop:'1px solid #334155',paddingTop:12}}>
          <b>🎁 Redeem Code</b>
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <input value={redeemInput} onChange={e=>setRedeemInput(e.target.value)} placeholder="Enter Code e.g. SIKKIM100" style={{flex:1,padding:10,borderRadius:8,border:'1px solid #334155',background:'#0f172a',color:'white'}}/>
            <button onClick={handleRedeem} style={{background:'#facc15',color:'black',border:0,padding:'0 16px',borderRadius:8,fontWeight:'bold'}}>Redeem</button>
          </div>
          <div style={{fontSize:11,opacity:0.6,marginTop:6}}>Expiry + Uses checked • 1 user 1 use • Try SIKKIM100, WELCOME50, GOLD500</div>
        </div>
      </div>
      {isAdmin && <div style={{marginTop:12,background:'#1e293b',padding:12,borderRadius:12}}><b>Create New Redeem</b><CreateCode codes={redeemCodes} setCodes={setRedeemCodes}/></div>}
    </div>}

    {view==='chat' && <div style={{padding:12}}>
      <h3>Public Chat {isAdmin && <span style={{color:'gold'}}>• Admin 👑</span>}</h3>
      <div ref={chatRef} style={{height:320,overflowY:'auto',background:'#1e293b',borderRadius:12,padding:8}}>
        {chat.map(m=><div key={m.id} style={{marginBottom:8,padding:8,borderRadius:8,background:m.isAdmin?'linear-gradient(90deg,#facc15,#eab308)':'#0f172a',color:m.isAdmin?'black':'white'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}><b style={{fontSize:12}}>{m.user} {m.isAdmin && <span style={{background:'black',color:'gold',padding:'1px 6px',borderRadius:6,fontSize:10}}>OFFICIAL 👑</span>}</b>{isAdmin && <button onClick={()=>setChat(c=>c.filter(x=>x.id!==m.id))} style={{background:'red',color:'white',border:0,borderRadius:4,fontSize:10}}>🗑️</button>}</div>
          <div style={{fontSize:14,marginTop:4}}>{m.text}</div><div style={{fontSize:10,opacity:0.6}}>{new Date(m.time).toLocaleTimeString()} • {m.isAdmin?'7 days':'24h'}</div>
        </div>)}
      </div>
      <div style={{display:'flex',gap:8,marginTop:8}}><input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Type..." style={{flex:1,padding:10,borderRadius:8,background:'#1e293b',border:'1px solid #334155',color:'white'}}/><button onClick={()=>sendChat(false)} style={{background:'#22c55e',border:0,padding:'0 16px',borderRadius:8}}>Send</button></div>
    </div>}

    {view==='user' && <div style={{padding:12}}>
      <h3>Tambola Lobby</h3>
      <div style={{background:'#1e293b',padding:16,borderRadius:12,textAlign:'center'}}>
        <div style={{fontSize:40}}>🎫</div>
        <div>Auto Game 24x7 - Voice ON</div>
        <div style={{marginTop:10,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>{Array.from({length:15}).map((_,i)=><div key={i} style={{border:'1px solid #334155',padding:12,borderRadius:8,background:'#0f172a'}}>{Math.floor(Math.random()*90)+1}</div>)}</div>
        <button style={{marginTop:12,width:'100%',padding:12,background:'#facc15',border:0,borderRadius:8,fontWeight:'bold'}}>Buy Ticket - 10 Coins</button>
      </div>
    </div>}

    {view==='admin' && <div style={{padding:12}}>
      {!isAdmin? <div style={{background:'#1e293b',padding:16,borderRadius:12}}><h3>Admin Login</h3><input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} placeholder="*QWERTYUIOP18 or 18022004" style={{width:'100%',padding:10,borderRadius:8,background:'#0f172a',color:'white',border:'1px solid #334155'}}/><button onClick={()=>{if(["*QWERTYUIOP18","18022004"].includes(adminPass)){setIsAdmin(true);localStorage.setItem('sg_isAdmin','1')}else alert('Wrong')}} style={{width:'100%',marginTop:8,padding:10,background:'#facc15',border:0,borderRadius:8,fontWeight:'bold'}}>Login</button></div> : <div><h3>👑 Admin Panel</h3><div style={{background:'linear-gradient(90deg,#facc15,#eab308)',color:'black',padding:12,borderRadius:12}}><b>Send as 👑 Admin - SikkimGo Official (Gold)</b><div style={{display:'flex',gap:8,marginTop:8}}><input value={adminChatInput} onChange={e=>setAdminChatInput(e.target.value)} placeholder="Type as Official..." style={{flex:1,padding:10,borderRadius:8,border:0}}/><button onClick={()=>sendChat(true)} style={{background:'black',color:'gold',border:0,padding:'0 16px',borderRadius:8,fontWeight:'bold'}}>Send 👑</button></div><div style={{fontSize:11,marginTop:6}}>Instant to Public Chat • 7 days stay • Can delete user msgs</div></div></div>}
    </div>}

    <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#1e293b',display:'flex',justifyContent:'space-around',padding:'8px 0',borderTop:'1px solid #334155',maxWidth:480,margin:'0 auto'}}>
      {[{k:'user',l:'🎲 Tambola'},{k:'wallet',l:'💰 Wallet'},{k:'chat',l:'💬 Chat'},{k:'admin',l:'👑 Admin'}].map(b=><button key={b.k} onClick={()=>setView(b.k as any)} style={{background:view===b.k?'#facc15':'transparent',color:view===b.k?'black':'white',border:0,padding:'8px 12px',borderRadius:8,fontSize:12}}>{b.l}</button>)}
    </div>
  </div>
}
function CreateCode({codes,setCodes}:{codes:any,setCodes:any}){
  const [code,setCode]=useState(''),[amt,setAmt]=useState(100),[exp,setExp]=useState('2026-12-31'),[uses,setUses]=useState(50)
  return <div style={{marginTop:8}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="CODE" style={{padding:8,borderRadius:6,background:'#0f172a',color:'white',border:'1px solid #334155'}}/><input type="number" value={amt} onChange={e=>setAmt(Number(e.target.value))} placeholder="Amt" style={{padding:8,borderRadius:6,background:'#0f172a',color:'white',border:'1px solid #334155'}}/><input type="date" value={exp} onChange={e=>setExp(e.target.value)} style={{padding:8,borderRadius:6,background:'#0f172a',color:'white',border:'1px solid #334155'}}/><input type="number" value={uses} onChange={e=>setUses(Number(e.target.value))} placeholder="Uses" style={{padding:8,borderRadius:6,background:'#0f172a',color:'white',border:'1px solid #334155'}}/></div><button onClick={()=>{if(!code)return; setCodes([...codes,{code,amount:amt,expiry:exp,usesLeft:uses,usedBy:[]}]); setCode('')}} style={{marginTop:8,width:'100%',padding:8,background:'#22c55e',border:0,borderRadius:6}}>Create</button></div>
}
