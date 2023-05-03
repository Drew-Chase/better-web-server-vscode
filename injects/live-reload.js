(() => {
    const pingServer = async () => {
        let url = window.location.pathname;
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response = await fetch('/injects/live-reload.php');
            if (response.ok) {
                const { reload, url: newUrl } = await response.json();
                console.log(`reload: ${reload}, url:${newUrl}`)
                if (reload == "true") {
                    let data = new FormData();
                    data.append("reload", false)
                    await fetch('/injects/live-reload.php', { method: "POST", body: data })
                    window.location.reload();
                }
            }
        }
    };

    pingServer();
})()