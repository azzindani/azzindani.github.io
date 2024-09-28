function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("closed");
    adjustLayout();
}

function adjustLayout() {
    var sidebar = document.getElementById("sidebar");
    var projectList = document.querySelector('.project-list');
    var content = document.querySelectorAll('.content');
    if (sidebar.classList.contains('closed')) {
        projectList.style.marginLeft = '0';
        content.forEach(item => {
            item.style.marginLeft = '0'; // Adjust content margin
        });
    } else {
        projectList.style.marginLeft = '270px'; // Adjust according to the sidebar width
        content.forEach(item => {
            item.style.marginLeft = '270px'; // Adjust content margin
        });
    }
}

// Adjust layout on page load
window.onload = adjustLayout;
