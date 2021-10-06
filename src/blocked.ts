/* Script to run on blocked.html. Add links backward and forward so people 
know where to go from the block page. */
document.addEventListener("DOMContentLoaded", (_) => {
  const url = new URL(document.location.href);
  const wp_domain = (document.getElementById('wp_domain') as any);
  const wp_requestURL = (document.getElementById("wp_requestURL") as any);

  // If we don't know what the initiator is, say as much
  if ( url.searchParams.get('initiator') === 'unknown') {
    const initiator_ctx = (document.getElementById('initiator_context') as any);
    initiator_ctx.innerText = "an external application, browser buttons, or a typed URL";
  } else {
    const wp_initiator = (document.getElementById('wp_initiator') as any);
    wp_initiator.href = url.searchParams.get('initiator');
    wp_initiator.innerText = url.searchParams.get('initiator')
    if (wp_initiator.innerText.length >= 50) {
      wp_initiator.innerText = wp_initiator.innerText.substr(0, 50) + '...'
    }
  }
  wp_requestURL.href = url.searchParams.get('requestURL')
  wp_requestURL.innerText = url.searchParams.get('requestURL')
  if (wp_requestURL.innerText.length >= 50) {
    wp_requestURL.innerText = wp_requestURL.innerText.substr(0, 50) + '...'
  }

  wp_domain.innerText = url.searchParams.get('domain');
});
