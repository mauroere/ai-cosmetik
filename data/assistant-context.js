const storeContext = {
    storeName: "Arbell Online",
    storeUrl: "www.arbellonline.com.ar",
    description: "Tienda de cosméticos y productos de belleza",
    products: [
        {
            id: 1,
            name: "Crema Hidratante Facial",
            description: "Crema hidratante facial con ingredientes naturales",
            price: 1299.99,
            image: "/images/crema-hidratante.jpg",
            category: "Cuidado Facial",
            stock: 10
        },
        {
            id: 2,
            name: "Serum Anti-Edad",
            description: "Serum anti-edad con vitamina C y ácido hialurónico",
            price: 2499.99,
            image: "/images/serum-anti-edad.jpg",
            category: "Tratamientos",
            stock: 5
        },
        {
            id: 3,
            name: "Mascarilla Purificante",
            description: "Mascarilla purificante con arcilla y aloe vera",
            price: 899.99,
            image: "/images/mascarilla-purificante.jpg",
            category: "Mascarillas",
            stock: 15
        }
    ]
};

module.exports = storeContext; 