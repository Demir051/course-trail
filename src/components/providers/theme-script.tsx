/** Blocking theme bootstrap — server-rendered, avoids React 19 client script warning. */
export function ThemeScript() {
  const code = `(function(){try{var k='coursetrail-theme';var t=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||((t==null||t==='system')&&d);var r=document.documentElement;r.classList.toggle('dark',dark);r.style.colorScheme=dark?'dark':'light';}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
