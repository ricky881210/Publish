window.onload = function () {
    function getProductUid(){
        const path = window.location.pathname;
        const pathParts = path.split('/');
        console.log(pathParts);
        return pathParts[pathParts.length - 1]
    }

    getProductUid();
    $.ajax({
        url: `http://localhost:3100/api/product/${$('#product_uid').text()}`,
        method: 'GET',
        success: function (data) {
            console.log(data);
            // let data.id=
            // $('#inventory').text(`${data.}`)
        }
    })
}