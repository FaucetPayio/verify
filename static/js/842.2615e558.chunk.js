(self.webpackChunkverify=self.webpackChunkverify||[]).push([[842],{7618:function(t,a,e){"use strict";e.d(a,{E1:function(){return d},yY:function(){return g},l_:function(){return i},ZD:function(){return u},K2:function(){return n},nr:function(){return v},Ir:function(){return f},Gw:function(){return x},jA:function(){return l},UM:function(){return o},Q9:function(){return h},B$:function(){return b},Rq:function(){return c},sK:function(){return F}});var r=e(271),s=function(t,a){var e=new RegExp("^-?\\d+(?:.\\d{0,"+(a||-1)+"})?"),r=t.toString().match(e);return r?r[0]:""},i=function(t,a,e){for(var r,i,n,p,o,c,d=a,u="",h=[],g=0;g<e;g++){var f=F.md.sha512.create();f.update(t+"-"+d),u=f.digest().toHex(),r=parseInt((u.substring(0,2)+"").replace(/[^a-f0-9]/gi,""),16),i=parseInt((u.substring(2,4)+"").replace(/[^a-f0-9]/gi,""),16),n=parseInt((u.substring(4,6)+"").replace(/[^a-f0-9]/gi,""),16),p=parseInt((u.substring(6,8)+"").replace(/[^a-f0-9]/gi,""),16),o=Math.floor(1e6*(r/Math.pow(256,1)+i/Math.pow(256,2)+n/Math.pow(256,3)+p/Math.pow(256,4))),c=s(parseFloat((1e6/(o+1)*.96).toString()),2),h.push({crashPoint:c,gameHash:d});var l=F.md.sha256.create();l.update(d),d=l.digest().toHex()}return h},n=function(t,a,e){var r=a+":"+t+":"+e,s=F.md.sha256.create();s.update(a);var i=s.digest().toHex(),n=F.md.sha512.create();n.update(r);for(var p=(r=n.digest().toHex()).length,o=0,c=1e6,d="";c>=1e6&&(d=r.substring(o,o+5),c=parseInt((d+"").replace(/[^a-f0-9]/gi,""),16),!(o+5>p));)o+=5;var u="Impossible Game";return c<1e6&&(u="".concat(c%1e4)),{serverSeed:i,rollResult:u}},p={8:{low:[4,1.82,1.1,1,.5,1,1.1,1.82,4],medium:[14,2.4,1.3,.7,.4,.7,1.3,2.4,14],high:[28,3.63,1.5,.3,.2,.3,1.5,3.63,28]},9:{low:[6,1.9,1.4,1,.7,.7,1,1.4,1.9,6],medium:[17,3.2,1.7,.9,.5,.5,.9,1.7,3.2,17],high:[42.2,6.2,2,.6,.2,.2,.6,2,6.2,42.2]},10:{low:[7,2.1,1.3,1.1,1,.5,1,1.1,1.3,2.1,7],medium:[20,3.7,2,1.4,.6,.4,.6,1.4,2,3.7,20],high:[70,9,3,.9,.3,.2,.3,.9,3,9,70]},11:{low:[7,1.8,1.6,1.3,1,.7,.7,1,1.3,1.6,1.8,7],medium:[24,4.6,2.7,1.8,.7,.5,.5,.7,1.8,2.7,4.6,24],high:[120,11,5.2,1.4,.4,.2,.2,.4,1.4,5.2,11,120]},12:{low:[5,1.8,1.3,1.3,1.1,1,.5,1,1.1,1.3,1.3,1.8,5],medium:[33,8,3.6,2,1.1,.6,.3,.6,1.1,2,3.6,8,33],high:[163,21,8.1,1.9,.7,.2,.2,.2,.7,1.9,8.1,21,163]},13:{low:[8,3.2,1.9,1.8,1.2,.9,.7,.7,.9,1.2,1.8,1.9,3.2,8],medium:[40,12,5,2.9,1.3,.7,.4,.4,.7,1.3,2.9,5,12,40],high:[252,36,10,3.9,1,.2,.2,.2,.2,1,3.9,10,36,252]},14:{low:[7,2.5,2,1.3,1.1,1.1,1,.5,1,1.1,1.1,1.3,2,2.5,7],medium:[58,15,5.8,3.9,1.8,1,.5,.2,.5,1,1.8,3.9,5.8,15,58],high:[420,50,17,4.8,1.9,.3,.2,.2,.2,.3,1.9,4.8,17,50,420]},15:{low:[13,6.5,2,1.5,1.4,1.1,1,.7,.7,1,1.1,1.4,1.5,2,6.5,13],medium:[88,19,10,4.4,2.9,1.3,.5,.3,.3,.5,1.3,2.9,4.4,10,19,88],high:[620,79,27,7,3,.5,.2,.2,.2,.2,.5,3,7,27,79,620]},16:{low:[14,5,1.4,1.3,1.2,1.1,1.1,1,.5,1,1.1,1.1,1.2,1.3,1.4,5,14],medium:[110,41,8,4,2.9,1.5,1,.5,.3,.5,1,1.5,2.9,4,8,41,110],high:[1e3,100,22,9,4,2,.2,.2,.2,.2,.2,2,4,9,22,100,1e3]}},o=function(t,a,e,r,s){var i=[],n=[],o=0,c=F.md.sha256.create();c.update(a);var d=c.digest().toHex(),u=F.hmac.create();u.start("sha256",a),u.update(t+":"+e+":0");var h=u.digest().toHex(),g=F.hmac.create();g.start("sha256",a),g.update(t+":"+e+":1");var f=g.digest().toHex(),l=F.hmac.create();l.start("sha256",a),l.update(t+":"+e+":2");for(var m=l.digest().toHex(),v=0,b=0;b<32;b++)v=2*b,i.push(h.substring(2*b,v+2));for(var x=0;x<32;x++)v=2*x,i.push(f.substring(2*x,v+2));for(var w=0;w<32;w++)v=2*w,i.push(m.substring(2*w,v+2));for(var I=0;I<20;I++){var X=4*I,M=parseInt(i[X],16)/Math.pow(256,1),S=parseInt(i[X+1],16)/Math.pow(256,2),H=parseInt(i[X+2],16)/Math.pow(256,3),y=parseInt(i[X+3],16)/Math.pow(256,4),j=parseFloat(M.toString()).toFixed(12),k=parseFloat(S.toString()).toFixed(12),N=parseFloat(H.toString()).toFixed(12),_=parseFloat(y.toString()).toFixed(12),A=Math.floor(2*(+j+ +k+ +N+ +_));n.push(A)}n=n.slice(0,r);for(var Z=0;Z<n.length;Z++)o=+o+ +n[Z];return{result:p[r][s][o],server_seed_hash:d}},c=function(t,a,e){var r=[],i=[],n=0,p=F.md.sha256.create();p.update(a);for(var o=p.digest().toHex(),c=0,d=0;d<8;d++){var u=F.hmac.create();u.start("sha256",a),u.update(t+":"+e+":"+d);for(var h=u.digest().toHex(),g=0;g<32;g++)c=2*g,r.push(h.substring(2*g,c+2))}for(var f=52;f>0;f--){var l=parseInt(r[n+0],16)/Math.pow(256,1),m=parseInt(r[n+1],16)/Math.pow(256,2),v=parseInt(r[n+2],16)/Math.pow(256,3),b=parseInt(r[n+3],16)/Math.pow(256,4),x=parseFloat(l.toString()).toFixed(12),w=parseFloat(m.toString()).toFixed(12),I=parseFloat(v.toString()).toFixed(12),X=parseFloat(b.toString()).toFixed(12),M=s(+x+ +w+ +I+ +X,12),S=s(+M*f,0);n+=4,i.push(S)}var H=Array.from(Array(51).keys()),y=[],j=[];return i.every((function(t){var a=H[+t];if(y.length<5)y.push(a);else{if(!(j.length<5))return!1;j.push(a)}return H.splice(+t,1),!0})),{cards:{initial:y,coming:j},seed:o}},d=function(t,a,e){var r=[],i=F.md.sha256.create();i.update(a);var n=i.digest().toHex(),p=F.hmac.create();p.start("sha256",a),p.update(t+":"+e);for(var o=p.digest().toHex(),c=0,d=0;d<32;d++)c=2*d,r.push(o.substring(2*d,c+2));var u=parseInt(r[0],16)/Math.pow(256,1),h=parseInt(r[1],16)/Math.pow(256,2),g=parseInt(r[2],16)/Math.pow(256,3),f=parseInt(r[3],16)/Math.pow(256,4),l=parseFloat(u.toString()).toFixed(12),m=parseFloat(h.toString()).toFixed(12),v=parseFloat(g.toString()).toFixed(12),b=parseFloat(f.toString()).toFixed(12),x=s(1e6*(+l+ +m+ +v+ +b),0);return{payout:s(1e6/(+x+1)*.97/1,2),server_seed_hash:n}},u=function(t,a,e){var r=[],s=[],i=F.md.sha256.create();i.update(a);var n=i.digest().toHex(),p=F.hmac.create();p.start("sha256",a),p.update(t+":"+e);for(var o=p.digest().toHex(),c=0,d=0;d<32;d++)c=2*d,r.push(o.substring(2*d,c+2));for(var u=0;u<20;u++){var h=4*u,g=parseInt(r[h+0],16)/Math.pow(256,1),f=parseInt(r[h+1],16)/Math.pow(256,2),l=parseInt(r[h+2],16)/Math.pow(256,3),m=parseInt(r[h+3],16)/Math.pow(256,4),v=parseFloat(g.toString()).toFixed(12),b=parseFloat(f.toString()).toFixed(12),x=parseFloat(l.toString()).toFixed(12),w=parseFloat(m.toString()).toFixed(12),I=Math.floor(7*(+v+ +b+ +x+ +w));s.push(I)}return{diamonds:s=s.slice(0,5),seed:n}},h=function(t,a,e){var r=[],i=F.md.sha256.create();i.update(a);var n=i.digest().toHex(),p=F.hmac.create();p.start("sha256",a),p.update(t+":"+e);for(var o=p.digest().toHex(),c=0,d=0;d<32;d++)c=2*d,r.push(o.substring(2*d,c+2));var u=parseInt(r[0],16)/Math.pow(256,1),h=parseInt(r[1],16)/Math.pow(256,2),g=parseInt(r[2],16)/Math.pow(256,3),f=parseInt(r[3],16)/Math.pow(256,4),l=parseFloat(u.toString()).toFixed(12),m=parseFloat(h.toString()).toFixed(12),v=parseFloat(g.toString()).toFixed(12),b=parseFloat(f.toString()).toFixed(12);return{result:s(37*(+l+ +m+ +v+ +b),0),seed:n}},g=function(t,a,e){var r=[],i=[],n=0,p=F.md.sha256.create();p.update(a);for(var o=p.digest().toHex(),c=0,d=0;d<7;d++){var u=F.hmac.create();u.start("sha256",a),u.update(t+":"+e+":"+d);for(var h=u.digest().toHex(),g=0;g<32;g++)c=2*g,r.push(h.substring(2*g,c+2))}for(var f=52;f>0;f--){var l=parseInt(r[n+0],16)/Math.pow(256,1),m=parseInt(r[n+1],16)/Math.pow(256,2),v=parseInt(r[n+2],16)/Math.pow(256,3),b=parseInt(r[n+3],16)/Math.pow(256,4),x=parseFloat(l.toString()).toFixed(12),w=parseFloat(m.toString()).toFixed(12),I=parseFloat(v.toString()).toFixed(12),X=parseFloat(b.toString()).toFixed(12),M=s(+x+ +w+ +I+ +X,12),S=s(52*+M,0);n+=4,i.push(+S)}for(var H=[i[0],i[1]],y=[i[2],i[3]],j=[],k=4;k<52;k++)j.push(i[k]);return{cards:{player:H,dealer:y,all:j},seed:o}},f=function(t,a,e){var r=[],s=[],i=[],n=Array.from({length:40},(function(t,a){return a+1})),p=F.md.sha256.create();p.update(a);var o=p.digest().toHex(),c=F.hmac.create();c.start("sha256",a),c.update(t+":"+e+":0");var d=c.digest().toHex(),u=F.hmac.create();u.start("sha256",a),u.update(t+":"+e+":1");for(var h=u.digest().toHex(),g=0,f=0;f<32;f++)g=2*f,s.push(d.substring(2*f,g+2));for(var l=0;l<32;l++)g=2*l,s.push(h.substring(2*l,g+2));for(var m=0;m<10;m++){var v=4*m,b=40-m,x=parseInt(s[v+0],16)/Math.pow(256,1),w=parseInt(s[v+1],16)/Math.pow(256,2),I=parseInt(s[v+2],16)/Math.pow(256,3),X=parseInt(s[v+3],16)/Math.pow(256,4),M=parseFloat(x.toString()).toFixed(12),S=parseFloat(w.toString()).toFixed(12),H=parseFloat(I.toString()).toFixed(12),y=parseFloat(X.toString()).toFixed(12),j=Math.floor((+M+ +S+ +H+ +y)*b);i.push(j)}for(var k=0;k<i.length;k++){var N=n[i[k]];r.push(N),n.splice(i[k],1)}return{result:r,seed:o}},l=function(t,a,e,r){var i=[],n=Array.from(Array(25).keys()),p=[],o=0,c=F.md.sha256.create();c.update(a);var d=c.digest().toHex(),u=F.hmac.create();u.start("sha256",a),u.update(t+":"+e+":0");var h=u.digest().toHex(),g=F.hmac.create();g.start("sha256",a),g.update(t+":"+e+":1");var f=g.digest().toHex(),l=F.hmac.create();l.start("sha256",a),l.update(t+":"+e+":2");for(var m=l.digest().toHex(),v=0,b=0;b<32;b++)v=2*b,i.push(h.substring(2*b,v+2));for(var x=0;x<32;x++)v=2*x,i.push(f.substring(2*x,v+2));for(var w=0;w<32;w++)v=2*w,i.push(m.substring(2*w,v+2));for(var I=25;I>1;I--){var X=parseInt(i[o+0],16)/Math.pow(256,1),M=parseInt(i[o+1],16)/Math.pow(256,2),S=parseInt(i[o+2],16)/Math.pow(256,3),H=parseInt(i[o+3],16)/Math.pow(256,4),y=parseFloat(X.toString()).toFixed(12),j=parseFloat(M.toString()).toFixed(12),k=parseFloat(S.toString()).toFixed(12),N=parseFloat(H.toString()).toFixed(12),_=s(+y+ +j+ +k+ +N,12),A=s(+_*I,0);o+=4,p.push(+A)}for(var Z=[],T=0;T<25;T++)Z.push(!1);for(var P=0;P<r;P++){var R=n[p[P]];n.splice(p[P],1),Z[R]=!0}return{cells:Z,seed:d}},m=["1X","6X","1X","12X","1X","3X","1X","6X","1X","3X","1X","52XA","1X","3X","1X","6X","3X","1X","12X","1X","6X","1X","3X","1X","25X","1X","3X","1X","6X","1X","3X","1X","12X","1X","6X","1X","3X","1X","52XB","3X","1X","3X","1X","3X","1X","12X","1X","6X","1X","3X","1X","25X","1X","3X"],v=function(t,a,e){for(var r,i,n,p,o,c=[],d=0;d<=e;d++){var u=F.md.sha512.create();u.update(t+"-"+a),r=u.digest().toHex(),i=parseInt((r.substring(0,2)+"").replace(/[^a-f0-9]/gi,""),16),n=parseInt((r.substring(2,4)+"").replace(/[^a-f0-9]/gi,""),16),p=parseInt((r.substring(4,6)+"").replace(/[^a-f0-9]/gi,""),16),o=parseInt((r.substring(6,8)+"").replace(/[^a-f0-9]/gi,""),16);var h=s(i/Math.pow(256,1)+n/Math.pow(256,2)+p/Math.pow(256,3)+o/Math.pow(256,4),12),g=s(53*+h,0),f=m[+g];c.push({outcome:f,seed:a});var l=F.md.sha256.create();l.update(a),a=l.digest().toHex()}return c},b=function(t,a,e,r){var i=4;"medium"===r||"wicked"===r?i=3:"hard"===r&&(i=2);var n=F.md.sha256.create();n.update(a);for(var p=n.digest().toHex(),o=[],c=0;c<9;++c){var d=[],u=F.md.sha256.create();u.update(a),p=u.digest().toHex();var h=F.hmac.create();h.start("sha256",a),h.update(t+":"+e+":"+c);for(var g=h.digest().toHex(),f=0,l=0;l<32;l++)f=2*l,d.push(g.substring(2*l,f+2));for(var m=parseInt(d[0],16)/Math.pow(256,1),v=parseInt(d[1],16)/Math.pow(256,2),b=parseInt(d[2],16)/Math.pow(256,3),x=parseInt(d[3],16)/Math.pow(256,4),w=parseFloat(m.toString()).toFixed(12),I=parseFloat(v.toString()).toFixed(12),X=parseFloat(b.toString()).toFixed(12),M=parseFloat(x.toString()).toFixed(12),S=s(+w+ +I+ +X+ +M,12),H=parseInt(s(+S*i,0)),y=[],j=[],k=[],N=0;N<i;N++)N!==H&&y.push(N);"wicked"===r||"brutal"===r?(j.push(H),k=y):(j=y,k.push(H)),o.push({good_locations:j,bad_locations:k})}for(var _=o.reverse(),A=[],Z=0;Z<_.length;Z++){for(var T=[],P=0;P<i;P++)_[Z].good_locations.includes(P)?T.push(!0):T.push(!1);A.push(T)}return{tower:A,seed:p}},x=function(t,a){var e=F.md.sha256.create();e.update(a);var r=e.digest().toHex(),s=F.hmac.create();s.start("sha256",a),s.update(t);for(var i=s.digest().toHex(),n=Array(36).fill(null).map((function(t,a){return a+1})),p=[],o=0;o<5;o++){var c=8*o,d=parseInt(i.substring(c,c+8),16),u=Math.floor(d/4294967296*n.length);p.push(n.splice(u,1)[0])}return{winNumbers:p,jackpot:Math.floor(parseInt(i.substring(40,48),16)/4294967296*10)+1,hash:r}},F=e.n(r)()},8237:function(t,a,e){"use strict";e.d(a,{Zb:function(){return f},lS:function(){return l},e8:function(){return n},gN:function(){return d},II:function(){return h},PI:function(){return i}});var r=e(2791),s=e(184),i=function(t){var a=t.children;return(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"lead",children:"This page does not send any data to the server. All of the calculations happen right in your browser."}),(0,s.jsx)("p",{children:"We've the following parameters:"}),a]})},n=function(){return(0,s.jsxs)("p",{children:["If you are interested in checking the code behind this, please open ",(0,s.jsx)("b",{children:(0,s.jsx)("a",{href:"https://github.com/FaucetPayio/verify",target:"_blank",children:"source code"})}),"."]})},p=e(8683),o=e(4925),c=e(8182),d=function(t){var a=t.subTitle,e=t.title,r=t.children,i=t.className;return(0,s.jsxs)("div",{className:(0,c.Z)("inputWrapper",i),children:[(0,s.jsx)("p",{children:e}),r,(0,s.jsx)("small",{className:"text-secondary ",children:a})]})},u=["subTitle","title","className"],h=function(t){var a=t.subTitle,e=t.title,r=t.className,i=(0,o.Z)(t,u);return(0,s.jsx)(d,{subTitle:a,title:e,children:(0,s.jsx)("input",(0,p.Z)((0,p.Z)({},i),{},{className:(0,c.Z)("form-control me-sm-2",r),type:"text"}))})},g=[e.p+"static/media/0.ee39c7dcbcefb2b36233.png",e.p+"static/media/1.44b256f0852baad7af62.png",e.p+"static/media/2.b0efcac0effc71114704.png",e.p+"static/media/3.2fe3f08c1c1199f5324e.png",e.p+"static/media/4.e8d502ddb5a3559bbe48.png",e.p+"static/media/5.ec26afbd76698f068fe2.png",e.p+"static/media/6.9c2eae6ccfa5ace8e6a1.png",e.p+"static/media/7.740490f682f11c1dcc4c.png",e.p+"static/media/8.6198dfa5a839ffe15aca.png",e.p+"static/media/9.5c782cf1ec5356eda1fa.png",e.p+"static/media/10.8c4d9f8ffa1f60348c83.png",e.p+"static/media/11.03a7794234fe165b2572.png",e.p+"static/media/12.0eeb59f155af62d0d734.png",e.p+"static/media/13.89ec143821d8606b08c0.png",e.p+"static/media/14.a4fb9b31390753187fa5.png",e.p+"static/media/15.558517b07098cc903ccc.png",e.p+"static/media/16.d9bad49c7b55c1406c07.png",e.p+"static/media/17.490e85cf59df90d10e29.png",e.p+"static/media/18.2a77a732ec35c68a9e6e.png",e.p+"static/media/19.3620f833e1f21345d95c.png",e.p+"static/media/20.230fd8a65e477c0936f9.png",e.p+"static/media/21.e131e73a0cfc02b725c3.png",e.p+"static/media/22.5275b8fb75082fe76b07.png",e.p+"static/media/23.14a56224107b90e4c0a2.png",e.p+"static/media/24.f364d5554826aea4d360.png",e.p+"static/media/25.ebac5b45a2747838013a.png",e.p+"static/media/26.2d48dd6845cf522f9a55.png",e.p+"static/media/27.a8bc06d19fd3c86f2146.png",e.p+"static/media/28.a24056d5095de96fc697.png",e.p+"static/media/29.21b32cac9c128c8c9365.png",e.p+"static/media/30.6b23955cb9971fde6df0.png",e.p+"static/media/31.6965773f58bc68691d75.png",e.p+"static/media/32.7ae9eea7487c88710063.png",e.p+"static/media/33.4c239d9d2aacfb162970.png",e.p+"static/media/34.b2e5f80068d68337f23c.png",e.p+"static/media/35.9ed3d91b271d47faa235.png",e.p+"static/media/36.66d734e61d3fd24989e8.png",e.p+"static/media/37.28c2c59f8e02adb0f179.png",e.p+"static/media/38.47d629305ca5ac7cb027.png",e.p+"static/media/39.81c29a174ddbdaae24e8.png",e.p+"static/media/40.028ad7d4f96fd38d6215.png",e.p+"static/media/41.4bc634e4dbae1def33ee.png",e.p+"static/media/42.6ff68c3367a8bcc8937c.png",e.p+"static/media/43.7c55d8500b5d578f53d0.png",e.p+"static/media/44.2e5ab48361135b4a4dc0.png",e.p+"static/media/45.3f8b369751e2ddbf6466.png",e.p+"static/media/46.ee2a7f62bc7a813301b0.png",e.p+"static/media/47.789e806884e7b801970b.png",e.p+"static/media/48.f3b345b1733636b7cc1a.png",e.p+"static/media/49.cc5001d4d77b31d9c0a6.png",e.p+"static/media/50.4832a80ad9754c07d5d2.png",e.p+"static/media/51.1048c60ec47e687a1337.png",e.p+"static/media/blue_back.ffea2912aff9a0d75587.png"],f=function(t){var a=t.id;return(0,s.jsx)("img",{src:g[a],alt:"card#".concat(a)})},l=function(t){var a=t.cards,e=t.title,i=t.subTitle,n=t.className;return(0,s.jsx)("div",{children:(0,s.jsx)(d,{title:e,subTitle:i,children:(0,s.jsx)("div",{className:(0,c.Z)("cards",n),children:a.map((function(t,a){return(0,s.jsx)(r.Fragment,{children:(0,s.jsx)(f,{id:t})},"".concat(t,"_").concat(a))}))})})})}},5819:function(){}}]);
//# sourceMappingURL=842.2615e558.chunk.js.map