window.onload = function () {

    // <搜尋功能>

    function displayProducts(type, searchTerm = "") {
        const config = {
            product: {
                url: 'http://localhost:3100/data/product',
                container: '#title',
                titleKey: 'product_title'
            },
            recipe: {
                url: 'http://localhost:3100/data/recipe',
                container: '#recipe',
                titleKey: 'recipe_title'
            },
            ingredients: {
                url: 'http://localhost:3100/data/ingredients_for_recipe',
                container: '#ingredients',
                titleKey: 'ingredient_name'
            },
        };

        const { url, container, titleKey } = config[type];

        $(container).empty();
        let hasResult = false;

        $.ajax({
            url: url,
            method: 'GET',
            success: function (data) {
                $.each(data, function (index, elem) {
                    let title = elem[titleKey];

                    if (searchTerm === "" || title.includes(searchTerm)) {
                        $(container).append(`<div>${title}</div>`);
                        hasResult = true;
                    }
                })

                if (!hasResult && searchTerm !== "") {
                    $(container).append(`無匹配結果`)
                }
            }
        })
    }

    $.ajax({
        url: 'http://localhost:3100/data/recipe',
        method: 'GET',
        success: function(data){
            $.each(data, function(index, elem){
                let style = elem[style]
                $('#style').append(`<option>${style}</option>`)
            })
        }
    })

    // 進入即顯示
    displayProducts('product');
    displayProducts('recipe');
    displayProducts('ingredients');


    // 搜尋結果
    $('#searchTiltle').on('input', function () {
        displayProducts('product', $(this).val());
    })
    $('#searchRecipe').on('input', function () {
        displayProducts('recipe', $(this).val());
    })
    $('#searchIngredients').on('input', function () {
        displayProducts('ingredients', $(this).val());
    })
    // </搜尋功能>
}