export function loadAnalytics(gaId: string | null, metaPixelId: string | null) {
  if (typeof window === 'undefined') return;

  const load = () => {
    if (gaId && !(window as any).gtag) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);
    }
    
    if (metaPixelId && !(window as any).fbq) {
      (function(f:any,b:any,e:any,v:any,n:any)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];const t=b.createElement(e);t.async=!0;
      t.src=v;const s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js'));
      (window as any).fbq('init', metaPixelId);
      (window as any).fbq('track', 'PageView');
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}
