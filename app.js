// ======================================================
// SCRAPBOOK STORE
// Frontend Website
// ======================================================


// ======================================================
// 1. API GOOGLE APPS SCRIPT
// ======================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec";


// Produk sekarang TIDAK ditulis di kode.
// Data akan diambil dari Google Sheets.
let products = [];

let selectedCategory = "all";

let cart =
  JSON.parse(
    localStorage.getItem("scrapbookCart")
  ) || [];


// ======================================================
// 2. ELEMENT HTML
// ======================================================

const productGrid =
  document.getElementById("productGrid");

const productCount =
  document.getElementById("productCount");

const searchInput =
  document.getElementById("searchInput");

const categoryList =
  document.getElementById("categoryList");

const cartCount =
  document.getElementById("cartCount");

const cartTotal =
  document.getElementById("cartTotal");

const checkoutTotal =
  document.getElementById("checkoutTotal");

const cartItems =
  document.getElementById("cartItems");

const cartDrawer =
  document.getElementById("cartDrawer");

const cartOverlay =
  document.getElementById("cartOverlay");

const openCartButton =
  document.getElementById("openCartButton");

const closeCartButton =
  document.getElementById("closeCartButton");

const checkoutButton =
  document.getElementById("checkoutButton");

const checkoutModal =
  document.getElementById("checkoutModal");

const closeCheckoutButton =
  document.getElementById("closeCheckoutButton");

const checkoutForm =
  document.getElementById("checkoutForm");


// ======================================================
// 3. FORMAT RUPIAH
// ======================================================

function formatRupiah(number) {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }
  ).format(Number(number) || 0);

}


// ======================================================
// 4. ICON KATEGORI
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
// 5. AMBIL PRODUCTS DARI GOOGLE SHEETS
// ======================================================

async function loadProducts() {

  productGrid.innerHTML = `
    <div class="loading-message">
      Memuat koleksi dari toko... ✨
    </div>
  `;

  productCount.textContent =
    "Memuat produk...";


  try {

    const response =
      await fetch(
        `${API_URL}?action=products&t=${Date.now()}`
      );


    if (!response.ok) {

      throw new Error(
        "Gagal menghubungi server."
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        "Data produk gagal dimuat."
      );

    }


    products =
      Array.isArray(data.products)
        ? data.products
        : [];


    // Pastikan tipe datanya benar
    products = products.map(product => ({

      ...product,

      price:
        Number(product.price) || 0,

      stock:
        Number(product.stock) || 0,

      active:
        product.active === true

    }));


    syncCartWithProducts();

    renderCategories();

    renderProducts();

    renderCart();

  }

  catch (error) {

    console.error(
      "LOAD PRODUCTS ERROR:",
      error
    );


    productGrid.innerHTML = `
      <div class="loading-message">
        ⚠️ Produk belum dapat dimuat.
        <br><br>
        Coba refresh halaman.
      </div>
    `;


    productCount.textContent =
      "Gagal memuat produk";

  }

}


// ======================================================
// 6. CATEGORY DINAMIS
// ======================================================

function renderCategories() {

  const categories =
    [
      ...new Set(
        products
          .filter(product => product.active)
          .map(product => product.category)
          .filter(Boolean)
      )
    ];


  categoryList.innerHTML = `

    <button
      type="button"
      class="category-button active"
      data-category="all"
    >
      Semua
    </button>

    ${categories
      .map(category => `
        <button
          type="button"
          class="category-button"
          data-category="${category}"
        >
          ${category}
        </button>
      `)
      .join("")}

  `;

}


// ======================================================
// 7. TAMPILKAN PRODUCTS
// ======================================================

function renderProducts() {

  const keyword =
    searchInput.value
      .toLowerCase()
      .trim();


  const filteredProducts =
    products.filter(product => {

      if (!product.active) {
        return false;
      }


      const name =
        String(
          product.product_name || ""
        ).toLowerCase();


      const description =
        String(
          product.description || ""
        ).toLowerCase();


      const category =
        String(
          product.category || ""
        ).toLowerCase();


      const matchesSearch =
        name.includes(keyword) ||
        description.includes(keyword) ||
        category.includes(keyword);


      const matchesCategory =
        selectedCategory === "all" ||
        product.category === selectedCategory;


      return (
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
            <div
              class="product-image-placeholder"
            >
              ${getCategoryIcon(
                product.category
              )}
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

              <span
                class="product-category"
              >
                ${product.category}
              </span>


              <h3 class="product-name">
                ${product.product_name}
              </h3>


              <p
                class="product-description"
              >
                ${product.description}
              </p>


              <div class="product-footer">

                <div>

                  <strong
                    class="product-price"
                  >
                    ${formatRupiah(
                      product.price
                    )}
                  </strong>


                  <span
                    class="product-stock"
                  >
                    ${stockText}
                  </span>

                </div>


                <button
                  type="button"
                  class="add-cart-button"
                  onclick="addToCart(
                    '${product.product_id}'
                  )"
                  ${
                    product.stock <= 0
                      ? "disabled"
                      : ""
                  }
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
// 8. SEARCH
// ======================================================

searchInput.addEventListener(
  "input",
  renderProducts
);


// ======================================================
// 9. CATEGORY FILTER
// ======================================================

categoryList.addEventListener(
  "click",
  function(event) {

    const button =
      event.target.closest(
        ".category-button"
      );


    if (!button) {
      return;
    }


    document
      .querySelectorAll(
        ".category-button"
      )
      .forEach(item => {

        item.classList.remove(
          "active"
        );

      });


    button.classList.add(
      "active"
    );


    selectedCategory =
      button.dataset.category;


    renderProducts();

  }
);


// ======================================================
// 10. ADD TO CART
// ======================================================

function addToCart(productId) {

  const product =
    products.find(
      item =>
        item.product_id === productId
    );


  if (!product) {
    return;
  }


  if (product.stock <= 0) {

    alert(
      "Produk sedang habis."
    );

    return;
  }


  const existingItem =
    cart.find(
      item =>
        item.product_id === productId
    );


  if (existingItem) {

    if (
      existingItem.quantity >=
      product.stock
    ) {

      alert(
        "Jumlah melebihi stok yang tersedia."
      );

      return;
    }


    existingItem.quantity++;

  }

  else {

    cart.push({

      product_id:
        product.product_id,

      product_name:
        product.product_name,

      price:
        product.price,

      image_url:
        product.image_url,

      quantity: 1

    });

  }


  saveCart();

  renderCart();

  openCart();

}


// ======================================================
// 11. SINKRONKAN CART DENGAN SHEET
// ======================================================

function syncCartWithProducts() {

  cart =
    cart
      .map(cartItem => {

        const latestProduct =
          products.find(
            product =>
              product.product_id ===
              cartItem.product_id
          );


        if (
          !latestProduct ||
          !latestProduct.active ||
          latestProduct.stock <= 0
        ) {

          return null;

        }


        return {

          product_id:
            latestProduct.product_id,

          product_name:
            latestProduct.product_name,

          price:
            latestProduct.price,

          image_url:
            latestProduct.image_url,

          quantity:
            Math.min(
              cartItem.quantity,
              latestProduct.stock
            )

        };

      })
      .filter(Boolean);


  saveCart();

}


// ======================================================
// 12. SAVE CART
// ======================================================

function saveCart() {

  localStorage.setItem(
    "scrapbookCart",
    JSON.stringify(cart)
  );

}


// ======================================================
// 13. TOTAL CART
// ======================================================

function calculateCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      (
        item.price *
        item.quantity
      ),
    0
  );

}


// ======================================================
// 14. RENDER CART
// ======================================================

function renderCart() {

  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );


  cartCount.textContent =
    totalQuantity;


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

        const imageHTML =
          item.image_url

          ? `
            <img
              src="${item.image_url}"
              class="cart-item-image"
              alt="${item.product_name}"
            >
          `

          : `
            <div
              class="
                product-image-placeholder
                cart-item-image
              "
            >
              ✨
            </div>
          `;


        return `

          <div class="cart-item">

            ${imageHTML}


            <div>

              <div
                class="cart-item-name"
              >
                ${item.product_name}
              </div>


              <div
                class="cart-item-price"
              >
                ${formatRupiah(
                  item.price
                )}
              </div>


              <div
                style="
                  margin-top:8px;
                  display:flex;
                  align-items:center;
                  gap:8px;
                "
              >

                <button
                  type="button"
                  onclick="
                    changeQuantity(
                      '${item.product_id}',
                      -1
                    )
                  "
                >
                  −
                </button>


                <strong>
                  ${item.quantity}
                </strong>


                <button
                  type="button"
                  onclick="
                    changeQuantity(
                      '${item.product_id}',
                      1
                    )
                  "
                >
                  +
                </button>


                <button
                  type="button"
                  onclick="
                    removeFromCart(
                      '${item.product_id}'
                    )
                  "
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
// 15. UBAH QUANTITY
// ======================================================

function changeQuantity(
  productId,
  change
) {

  const cartItem =
    cart.find(
      item =>
        item.product_id === productId
    );


  const product =
    products.find(
      item =>
        item.product_id === productId
    );


  if (
    !cartItem ||
    !product
  ) {

    return;

  }


  cartItem.quantity += change;


  if (
    cartItem.quantity <= 0
  ) {

    removeFromCart(
      productId
    );

    return;
  }


  if (
    cartItem.quantity >
    product.stock
  ) {

    cartItem.quantity =
      product.stock;


    alert(
      "Jumlah maksimal sesuai stok."
    );

  }


  saveCart();

  renderCart();

}


// ======================================================
// 16. HAPUS PRODUK CART
// ======================================================

function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      item =>
        item.product_id !== productId
    );


  saveCart();

  renderCart();

}


// ======================================================
// 17. OPEN / CLOSE CART
// ======================================================

function openCart() {

  cartDrawer.classList.add(
    "active"
  );

  cartOverlay.classList.add(
    "active"
  );

}


function closeCart() {

  cartDrawer.classList.remove(
    "active"
  );

  cartOverlay.classList.remove(
    "active"
  );

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
// 18. CHECKOUT
// ======================================================

checkoutButton.addEventListener(
  "click",
  function() {

    if (cart.length === 0) {

      alert(
        "Keranjang masih kosong."
      );

      return;

    }


    closeCart();


    checkoutModal.classList.add(
      "active"
    );

  }
);


closeCheckoutButton.addEventListener(
  "click",
  function() {

    checkoutModal.classList.remove(
      "active"
    );

  }
);


// ======================================================
// 19. CHECKOUT SEMENTARA
// ======================================================

checkoutForm.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();


    alert(
      "Produk sudah berasal dari Google Sheets ✅\n\n" +
      "Berikutnya kita akan membuat order " +
      "benar-benar masuk ke sheet ORDERS."
    );

  }
);


// ======================================================
// 20. START WEBSITE
// ======================================================

loadProducts();
