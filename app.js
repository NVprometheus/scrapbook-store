// ======================================================
// SCRAPBOOK STORE - APP.JS
// Versi awal untuk testing frontend
// ======================================================


// ======================================================
// 1. DATA PRODUK DUMMY
// Nanti bagian ini akan diganti data dari Google Sheets
// ======================================================

const products = [
  {
    product_id: "PRD001",
    product_name: "Vintage Floral Paper",
    price: 15000,
    stock: 20,
    category: "Paper",
    image_url: "",
    description: "Kertas scrapbook motif floral vintage.",
    active: true,
    featured: true
  },
  {
    product_id: "PRD002",
    product_name: "Floral Sticker Pack",
    price: 12000,
    stock: 15,
    category: "Sticker",
    image_url: "",
    description: "Sticker floral untuk dekorasi scrapbook.",
    active: true,
    featured: true
  },
  {
    product_id: "PRD003",
    product_name: "Mini Vintage Journal",
    price: 35000,
    stock: 8,
    category: "Journal",
    image_url: "",
    description: "Journal mini dengan tema vintage.",
    active: true,
    featured: false
  }
];


// ======================================================
// 2. STATE / DATA SEMENTARA
// ======================================================

let selectedCategory = "all";

let cart = JSON.parse(
  localStorage.getItem("scrapbookCart")
) || [];


// ======================================================
// 3. AMBIL ELEMENT HTML
// ======================================================

const productGrid = document.getElementById("productGrid");
const productCount = document.getElementById("productCount");

const searchInput = document.getElementById("searchInput");
const categoryList = document.getElementById("categoryList");

const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const checkoutTotal = document.getElementById("checkoutTotal");

const cartItems = document.getElementById("cartItems");

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

const openCartButton = document.getElementById("openCartButton");
const closeCartButton = document.getElementById("closeCartButton");

const checkoutButton = document.getElementById("checkoutButton");

const checkoutModal = document.getElementById("checkoutModal");
const closeCheckoutButton = document.getElementById(
  "closeCheckoutButton"
);

const checkoutForm = document.getElementById("checkoutForm");


// ======================================================
// 4. FORMAT RUPIAH
// ======================================================

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}


// ======================================================
// 5. ICON PRODUK SEMENTARA
// ======================================================

function getCategoryIcon(category) {

  const icons = {
    Paper: "📜",
    Sticker: "🌸",
    Journal: "📖",
    Decoration: "🎀",
    Printable: "🖼️"
  };

  return icons[category] || "✨";
}


// ======================================================
// 6. TAMPILKAN PRODUK
// ======================================================

function renderProducts() {

  const keyword = searchInput.value
    .toLowerCase()
    .trim();


  const filteredProducts = products.filter(product => {

    const productActive =
      product.active === true;


    const matchesSearch =
      product.product_name
        .toLowerCase()
        .includes(keyword) ||

      product.description
        .toLowerCase()
        .includes(keyword) ||

      product.category
        .toLowerCase()
        .includes(keyword);


    const matchesCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory;


    return (
      productActive &&
      matchesSearch &&
      matchesCategory
    );

  });


  productCount.textContent =
    `${filteredProducts.length} produk`;


  if (filteredProducts.length === 0) {

    productGrid.innerHTML = `
      <div class="loading-message">
        Produk tidak ditemukan 😢
      </div>
    `;

    return;
  }


  productGrid.innerHTML =
    filteredProducts
      .map(product => {

        const imageHTML =
          product.image_url

            ? `
              <img
                class="product-image"
                src="${product.image_url}"
                alt="${product.product_name}"
                loading="lazy"
              >
            `

            : `
              <div class="product-image-placeholder">
                ${getCategoryIcon(product.category)}
              </div>
            `;


        const stockText =
          product.stock > 0

            ? `Stok ${product.stock}`

            : "Stok habis";


        return `
          <article class="product-card">

            ${imageHTML}

            <div class="product-info">

              <span class="product-category">
                ${product.category}
              </span>

              <h3 class="product-name">
                ${product.product_name}
              </h3>

              <p class="product-description">
                ${product.description}
              </p>


              <div class="product-footer">

                <div>

                  <strong class="product-price">
                    ${formatRupiah(product.price)}
                  </strong>

                  <span class="product-stock">
                    ${stockText}
                  </span>

                </div>


                <button
                  type="button"
                  class="add-cart-button"
                  onclick="addToCart('${product.product_id}')"
                  ${product.stock <= 0 ? "disabled" : ""}
                >
                  + Keranjang
                </button>

              </div>

            </div>

          </article>
        `;

      })
      .join("");
}


// ======================================================
// 7. SEARCH
// ======================================================

searchInput.addEventListener(
  "input",
  renderProducts
);


// ======================================================
// 8. CATEGORY FILTER
// ======================================================

categoryList.addEventListener(
  "click",
  function(event) {

    const button =
      event.target.closest(".category-button");


    if (!button) {
      return;
    }


    document
      .querySelectorAll(".category-button")
      .forEach(item => {

        item.classList.remove("active");

      });


    button.classList.add("active");


    selectedCategory =
      button.dataset.category;


    renderProducts();

  }
);


// ======================================================
// 9. ADD TO CART
// ======================================================

function addToCart(productId) {

  const product =
    products.find(
      item => item.product_id === productId
    );


  if (!product) {
    return;
  }


  const existingItem =
    cart.find(
      item => item.product_id === productId
    );


  if (existingItem) {

    if (existingItem.quantity >= product.stock) {

      alert("Jumlah melebihi stok yang tersedia.");

      return;
    }

    existingItem.quantity++;

  } else {

    cart.push({
      product_id: product.product_id,
      product_name: product.product_name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });

  }


  saveCart();

  renderCart();

  openCart();
}


// ======================================================
// 10. SAVE CART
// ======================================================

function saveCart() {

  localStorage.setItem(
    "scrapbookCart",
    JSON.stringify(cart)
  );

}


// ======================================================
// 11. HITUNG TOTAL CART
// ======================================================

function calculateCartTotal() {

  return cart.reduce(
    (total, item) =>
      total + (item.price * item.quantity),
    0
  );

}


// ======================================================
// 12. RENDER CART
// ======================================================

function renderCart() {

  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  cartCount.textContent = totalQuantity;


  const totalPrice =
    calculateCartTotal();


  cartTotal.textContent =
    formatRupiah(totalPrice);


  checkoutTotal.textContent =
    formatRupiah(totalPrice);


  if (cart.length === 0) {

    cartItems.innerHTML = `
      <div class="empty-cart">

        <span>🛒</span>

        <p>
          Keranjangmu masih kosong.
        </p>

      </div>
    `;

    return;
  }


  cartItems.innerHTML =
    cart
      .map(item => {

        return `
          <div class="cart-item">

            <div class="product-image-placeholder cart-item-image">
              ✨
            </div>


            <div>

              <div class="cart-item-name">
                ${item.product_name}
              </div>

              <div class="cart-item-price">
                ${formatRupiah(item.price)}
              </div>

              <div style="
                margin-top:8px;
                display:flex;
                align-items:center;
                gap:8px;
              ">

                <button
                  type="button"
                  onclick="changeQuantity(
                    '${item.product_id}',
                    -1
                  )"
                >
                  −
                </button>


                <strong>
                  ${item.quantity}
                </strong>


                <button
                  type="button"
                  onclick="changeQuantity(
                    '${item.product_id}',
                    1
                  )"
                >
                  +
                </button>


                <button
                  type="button"
                  onclick="removeFromCart(
                    '${item.product_id}'
                  )"
                  style="
                    margin-left:auto;
                    border:0;
                    background:transparent;
                    color:#b05e6b;
                  "
                >
                  Hapus
                </button>

              </div>

            </div>

          </div>
        `;

      })
      .join("");

}


// ======================================================
// 13. UBAH JUMLAH PRODUK
// ======================================================

function changeQuantity(productId, change) {

  const cartItem =
    cart.find(
      item => item.product_id === productId
    );


  const product =
    products.find(
      item => item.product_id === productId
    );


  if (!cartItem || !product) {
    return;
  }


  cartItem.quantity += change;


  if (cartItem.quantity <= 0) {

    removeFromCart(productId);

    return;
  }


  if (cartItem.quantity > product.stock) {

    cartItem.quantity = product.stock;

    alert("Jumlah maksimal sesuai stok.");

  }


  saveCart();

  renderCart();
}


// ======================================================
// 14. HAPUS CART
// ======================================================

function removeFromCart(productId) {

  cart = cart.filter(
    item => item.product_id !== productId
  );


  saveCart();

  renderCart();
}


// ======================================================
// 15. OPEN / CLOSE CART
// ======================================================

function openCart() {

  cartDrawer.classList.add("active");
  cartOverlay.classList.add("active");

}


function closeCart() {

  cartDrawer.classList.remove("active");
  cartOverlay.classList.remove("active");

}


openCartButton.addEventListener(
  "click",
  openCart
);


closeCartButton.addEventListener(
  "click",
  closeCart
);


cartOverlay.addEventListener(
  "click",
  closeCart
);


// ======================================================
// 16. CHECKOUT MODAL
// ======================================================

checkoutButton.addEventListener(
  "click",
  function() {

    if (cart.length === 0) {

      alert("Keranjang masih kosong.");

      return;
    }


    closeCart();

    checkoutModal.classList.add("active");

  }
);


closeCheckoutButton.addEventListener(
  "click",
  function() {

    checkoutModal.classList.remove("active");

  }
);


// ======================================================
// 17. CHECKOUT SEMENTARA
// ======================================================

checkoutForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();


    alert(
      "Form checkout sudah bekerja! ✅\n\n" +
      "Pada tahap berikutnya pesanan ini " +
      "akan kita kirim ke Google Sheets."
    );

  }
);


// ======================================================
// 18. START WEBSITE
// ======================================================

renderProducts();

renderCart();
