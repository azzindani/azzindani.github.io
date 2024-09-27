document.getElementById("openBtn").addEventListener("click", function() {
    document.getElementById("sidebar").style.left = "0";
    document.getElementById("main-content").classList.add("sidebar-open");
});

document.getElementById("closeBtn").addEventListener("click", function() {
    document.getElementById("sidebar").style.left = "-250px";
    document.getElementById("main-content").classList.remove("sidebar-open");
});
