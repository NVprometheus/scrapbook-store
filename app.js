// ======================================================
// SCRAPBOOK STORE
// Frontend Website
// ======================================================

// ======================================================
// 1. API GOOGLE APPS SCRIPT
// ======================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycby72Zqja-7P7H1QcYfW9W_LxxtHF0KKy3p71bI4TrvB62CmkN_P9bVx0rEcki1juB2q/exec";


// ======================================================
// 2. GLOBAL STATE
// ======================================================

let products = [];
let selectedCategory = "all";

let cart =
  JSON.parse(
    localStorage.getItem("scrapbookCart")
  ) || [];


// ======================================================
// 3. ELEMENT HTML
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
// 4. REFERENCE LAMA
// ======================================================

const referenceModal =
  document.getElementById("referenceModal");

const openReferenceButton =
  document.getElementById("openReferenceButton");

const closeReferenceButton =
  document.getElementById("closeReferenceButton");

const referenceImage =
  document.getElementById("referenceImage");

const referencePrev =
  document.getElementById("referencePrev");

const referenceNext =
  document.getElementById("referenceNext");

const referenceDots =
  document.getElementById("referenceDots");

const referenceCounter =
  document.getElementById("referenceCounter");

const referenceTitle =
  document.getElementById("referenceTitle");

const referenceLoading =
  document.getElementById("referenceLoading");

const referenceCarousel =
  document.getElementById("referenceCarousel");


// ======================================================
// 5. FORMAT RUPIAH
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
// 6. ICON KATEGORI
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
// 7. AMBIL PRODUCTS DARI GOOGLE SHEETS
// ======================================================

async function loadProducts() {

  if (productGrid) {

    productGrid.innerHTML = `
      <div class="loading-message">
        Memuat koleksi dari toko... ✨
      </div>
    `;
  }

  if (productCount) {
    productCount.textContent = "Memuat produk...";
  }

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

    products =
      products.map(product => ({

        ...product,

        price:
          Number(product.price) || 0,

        stock:
          Number(product.stock) || 0,

        active:
          product.active === true ||
          product.active === "TRUE" ||
          product.active === "true" ||
          product.active === 1 ||
          product.active === "1"

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

    if (productGrid) {

      productGrid.innerHTML = `
        <div class="loading-message">
          ⚠️ Produk belum dapat dimuat.
          <br><br>
          Coba refresh halaman.
        </div>
      `;
    }

    if (productCount) {
      productCount.textContent =
        "Gagal memuat produk";
    }
  }
}


// ======================================================
// 8. CATEGORY DINAMIS
// ======================================================

function renderCategories() {

  if (!categoryList) {
    return;
  }

  const categories = [
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
      class="category-button ${
        selectedCategory === "all"
          ? "active"
          : ""
      }"
      data-category="all"
    >
      Semua
    </button>

    ${categories
      .map(category => `

        <button
          type="button"
          class="category-button ${
            selectedCategory === category
              ? "active"
              : ""
          }"
          data-category="${category}"
        >
          ${escapeHtml(category)}
        </button>

      `)
      .join("")}

  `;
}


// ======================================================
// 9. TAMPILKAN PRODUCTS
// ======================================================

function renderProducts() {

  if (!productGrid) {
    return;
  }

  const keyword =
    searchInput
      ? searchInput.value
          .toLowerCase()
          .trim()
      : "";

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

  if (productCount) {
    productCount.textContent =
      `${filteredProducts.length} produk`;
  }

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
                src="${escapeAttribute(
                  product.image_url
                )}"
                alt="${escapeAttribute(
                  product.product_name
                )}"
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

        const safeProductId =
          escapeAttribute(
            product.product_id
          );

        return `

          <article class="product-card">

            ${imageHTML}

            <div class="product-info">

              <span
                class="product-category"
              >
                ${escapeHtml(
                  product.category || ""
                )}
              </span>

              <h3 class="product-name">
                ${escapeHtml(
                  product.product_name || ""
                )}
              </h3>

              <p class="product-description">
                ${escapeHtml(
                  product.description || ""
                )}
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
                  onclick="addToCart('${safeProductId}')"
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
// 10. SEARCH
// ======================================================

if (searchInput) {

  searchInput.addEventListener(
    "input",
    renderProducts
  );

}


// ======================================================
// 11. CATEGORY FILTER
// ======================================================

if (categoryList) {

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

}


// ======================================================
// 12. ADD TO CART
// ======================================================

function addToCart(productId) {

  const product =
    products.find(
      item =>
        String(item.product_id) ===
        String(productId)
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
        String(item.product_id) ===
        String(productId)
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
// 13. SINKRONKAN CART DENGAN SHEET
// ======================================================

function syncCartWithProducts() {

  cart =
    cart
      .map(cartItem => {

        const latestProduct =
          products.find(
            product =>
              String(product.product_id) ===
              String(cartItem.product_id)
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
              Number(cartItem.quantity) || 1,
              latestProduct.stock
            )

        };

      })
      .filter(Boolean);

  saveCart();
}


// ======================================================
// 14. SAVE CART
// ======================================================

function saveCart() {

  localStorage.setItem(
    "scrapbookCart",
    JSON.stringify(cart)
  );

}


// ======================================================
// 15. TOTAL CART
// ======================================================

function calculateCartTotal() {

  return cart.reduce(
    (total, item) =>

      total +
      (
        Number(item.price) *
        Number(item.quantity)
      ),

    0
  );

}


// ======================================================
// 16. RENDER CART
// ======================================================

function renderCart() {

  if (!cartItems) {
    return;
  }

  const totalQuantity =
    cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  if (cartCount) {
    cartCount.textContent =
      totalQuantity;
  }

  const totalPrice =
    calculateCartTotal();

  if (cartTotal) {
    cartTotal.textContent =
      formatRupiah(totalPrice);
  }

  if (checkoutTotal) {
    checkoutTotal.textContent =
      formatRupiah(totalPrice);
  }

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
                src="${escapeAttribute(
                  item.image_url
                )}"
                class="cart-item-image"
                alt="${escapeAttribute(
                  item.product_name
                )}"
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

        const safeId =
          escapeAttribute(
            item.product_id
          );

        return `

          <div class="cart-item">

            ${imageHTML}

            <div>

              <div
                class="cart-item-name"
              >
                ${escapeHtml(
                  item.product_name || ""
                )}
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
                      '${safeId}',
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
                      '${safeId}',
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
                      '${safeId}'
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
// 17. UBAH QUANTITY
// ======================================================

function changeQuantity(
  productId,
  change
) {

  const cartItem =
    cart.find(
      item =>
        String(item.product_id) ===
        String(productId)
    );

  const product =
    products.find(
      item =>
        String(item.product_id) ===
        String(productId)
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
// 18. HAPUS PRODUK CART
// ======================================================

function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      item =>
        String(item.product_id) !==
        String(productId)
    );

  saveCart();

  renderCart();

}


// ======================================================
// 19. OPEN / CLOSE CART
// ======================================================

function openCart() {

  if (cartDrawer) {

    cartDrawer.classList.add(
      "active"
    );

  }

  if (cartOverlay) {

    cartOverlay.classList.add(
      "active"
    );

  }

}


function closeCart() {

  if (cartDrawer) {

    cartDrawer.classList.remove(
      "active"
    );

  }

  if (cartOverlay) {

    cartOverlay.classList.remove(
      "active"
    );

  }

}


if (openCartButton) {

  openCartButton.addEventListener(
    "click",
    openCart
  );

}


if (closeCartButton) {

  closeCartButton.addEventListener(
    "click",
    closeCart
  );

}


if (cartOverlay) {

  cartOverlay.addEventListener(
    "click",
    closeCart
  );

}


// ======================================================
// 20. CHECKOUT
// ======================================================

if (checkoutButton) {

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

      if (checkoutModal) {

        checkoutModal.classList.add(
          "active"
        );

      }

    }
  );

}


if (closeCheckoutButton) {

  closeCheckoutButton.addEventListener(
    "click",
    function() {

      if (checkoutModal) {

        checkoutModal.classList.remove(
          "active"
        );

      }

    }
  );

}


// ======================================================
// 21. CHECKOUT → GOOGLE SHEETS
// ======================================================

if (checkoutForm) {

  checkoutForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();

      if (cart.length === 0) {

        alert(
          "Keranjang masih kosong."
        );

        return;

      }

      const submitButton =
        checkoutForm.querySelector(
          ".submit-order-button"
        );

      const originalText =
        submitButton
          ? submitButton.textContent
          : "";

      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "Memproses pesanan...";

      }

      try {

        const payload = {

          action:
            "createOrder",

          customer_name:
            document
              .getElementById(
                "customerName"
              )
              .value
              .trim(),

          whatsapp:
            document
              .getElementById(
                "customerWhatsapp"
              )
              .value
              .trim(),

          address:
            document
              .getElementById(
                "customerAddress"
              )
              .value
              .trim(),

          payment_method:
            document
              .getElementById(
                "paymentMethod"
              )
              .value,

          notes:
            document
              .getElementById(
                "customerNotes"
              )
              .value
              .trim(),

          items:
            cart.map(item => ({

              product_id:
                item.product_id,

              quantity:
                item.quantity

            }))

        };


        const response =
          await fetch(
            API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "text/plain;charset=utf-8"
              },

              body:
                JSON.stringify(payload)
            }
          );


        const result =
          await response.json();


        if (!result.success) {

          throw new Error(
            result.message ||
            "Pesanan gagal dibuat."
          );

        }


        alert(
          "✅ PESANAN BERHASIL!\n\n" +
          "Order ID:\n" +
          result.order_id +
          "\n\n" +
          "Total:\n" +
          formatRupiah(
            result.total
          )
        );


        cart = [];

        saveCart();

        renderCart();


        checkoutForm.reset();


        if (checkoutModal) {

          checkoutModal.classList.remove(
            "active"
          );

        }


        await loadProducts();

      }

      catch (error) {

        console.error(
          "CREATE ORDER ERROR:",
          error
        );

        alert(
          "❌ Pesanan belum berhasil.\n\n" +
          error.message
        );

      }

      finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            originalText;

        }

      }

    }
  );

}


// ======================================================
// 22. REFERENCE LAMA
// ======================================================

let references = [];

let currentReferenceIndex = 0;


async function loadReferences() {

  if (referenceLoading) {

    referenceLoading.style.display =
      "block";

    referenceLoading.textContent =
      "Memuat referensi...";

  }

  if (referenceCarousel) {

    referenceCarousel.style.display =
      "none";

  }

  try {

    const response =
      await fetch(
        `${API_URL}?action=references&t=${Date.now()}`
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
        "Referensi gagal dimuat."
      );

    }

    references =
      Array.isArray(data.references)
        ? data.references
        : [];

    references =
      references.filter(
        item =>
          item.image_url ||
          item.image_urls
      );

    currentReferenceIndex = 0;

    renderReference();

  }

  catch (error) {

    console.error(
      "LOAD REFERENCES ERROR:",
      error
    );

    if (referenceLoading) {

      referenceLoading.style.display =
        "block";

      referenceLoading.textContent =
        "⚠️ Referensi belum dapat dimuat.";

    }

    if (referenceCarousel) {

      referenceCarousel.style.display =
        "none";

    }

  }

}


// ======================================================
// 23. RENDER REFERENCE LAMA
// ======================================================

function renderReference() {

  if (
    !referenceLoading ||
    !referenceCarousel
  ) {

    return;

  }

  if (references.length === 0) {

    referenceLoading.style.display =
      "block";

    referenceLoading.textContent =
      "Belum ada referensi.";

    referenceCarousel.style.display =
      "none";

    if (referenceTitle) {
      referenceTitle.textContent = "";
    }

    if (referenceDots) {
      referenceDots.innerHTML = "";
    }

    if (referenceCounter) {
      referenceCounter.textContent = "";
    }

    return;

  }


  referenceLoading.style.display =
    "none";

  referenceCarousel.style.display =
    "flex";


  const reference =
    references[
      currentReferenceIndex
    ];


  if (referenceImage) {

    referenceImage.src =
      reference.image_url ||
      reference.image_urls ||
      "";

    referenceImage.alt =
      reference.title ||
      "Referensi Scrapbook";

  }


  if (referenceTitle) {

    referenceTitle.textContent =
      reference.title || "";

  }


  if (referenceCounter) {

    referenceCounter.textContent =
      `${currentReferenceIndex + 1} / ${references.length}`;

  }


  if (referenceDots) {

    referenceDots.innerHTML =
      references
        .map(
          (item, index) => `

            <button
              type="button"
              class="reference-dot ${
                index === currentReferenceIndex
                  ? "active"
                  : ""
              }"
              onclick="goToReference(${index})"
              aria-label="Referensi ${
                index + 1
              }"
            ></button>

          `
        )
        .join("");

  }


  const showNavigation =
    references.length > 1;


  if (referencePrev) {

    referencePrev.style.display =
      showNavigation
        ? "grid"
        : "none";

  }


  if (referenceNext) {

    referenceNext.style.display =
      showNavigation
        ? "grid"
        : "none";

  }

}


// ======================================================
// 24. NEXT REFERENCE
// ======================================================

function nextReference() {

  if (references.length <= 1) {
    return;
  }

  currentReferenceIndex =
    (
      currentReferenceIndex + 1
    ) %
    references.length;

  renderReference();

}


// ======================================================
// 25. PREVIOUS REFERENCE
// ======================================================

function previousReference() {

  if (references.length <= 1) {
    return;
  }

  currentReferenceIndex =
    (
      currentReferenceIndex -
      1 +
      references.length
    ) %
    references.length;

  renderReference();

}


// ======================================================
// 26. PILIH DOT REFERENCE
// ======================================================

function goToReference(index) {

  if (
    index < 0 ||
    index >= references.length
  ) {

    return;

  }

  currentReferenceIndex =
    index;

  renderReference();

}


// ======================================================
// 27. OPEN REFERENCE
// ======================================================

function openReference() {

  if (!referenceModal) {
    return;
  }

  referenceModal.classList.add(
    "active"
  );

  renderReference();

}


// ======================================================
// 28. CLOSE REFERENCE
// ======================================================

function closeReference() {

  if (!referenceModal) {
    return;
  }

  referenceModal.classList.remove(
    "active"
  );

}


// ======================================================
// 29. BUTTON EVENTS REFERENCE LAMA
// ======================================================

if (openReferenceButton) {

  openReferenceButton.addEventListener(
    "click",
    openReference
  );

}


if (closeReferenceButton) {

  closeReferenceButton.addEventListener(
    "click",
    closeReference
  );

}


if (referencePrev) {

  referencePrev.addEventListener(
    "click",
    previousReference
  );

}


if (referenceNext) {

  referenceNext.addEventListener(
    "click",
    nextReference
  );

}


if (referenceModal) {

  referenceModal.addEventListener(
    "click",
    function(event) {

      if (
        event.target ===
        referenceModal
      ) {

        closeReference();

      }

    }
  );

}


// ======================================================
// 30. SWIPE REFERENCE LAMA
// ======================================================

let referenceTouchStartX = 0;


if (referenceImage) {

  referenceImage.addEventListener(
    "touchstart",
    function(event) {

      referenceTouchStartX =
        event.touches[0].clientX;

    },
    {
      passive: true
    }
  );


  referenceImage.addEventListener(
    "touchend",
    function(event) {

      const touchEndX =
        event.changedTouches[0].clientX;

      const difference =
        referenceTouchStartX -
        touchEndX;

      if (
        Math.abs(difference) < 50
      ) {

        return;

      }

      if (difference > 0) {

        nextReference();

      }

      else {

        previousReference();

      }

    },
    {
      passive: true
    }
  );

}


// ======================================================
// 31. KEYBOARD REFERENCE LAMA
// ======================================================

document.addEventListener(
  "keydown",
  function(event) {

    if (
      !referenceModal ||
      !referenceModal
        .classList
        .contains("active")
    ) {

      return;

    }

    if (
      event.key ===
      "ArrowRight"
    ) {

      nextReference();

    }

    if (
      event.key ===
      "ArrowLeft"
    ) {

      previousReference();

    }

    if (
      event.key ===
      "Escape"
    ) {

      closeReference();

    }

  }
);


// ======================================================
// 32. REFERENCES INSTAGRAM FEED
// ======================================================

const referencesState = {

  all: [],

  currentViewId: null,

  currentImageIndex: 0,

  touchStartX: 0,

  touchEndX: 0,

  isModalOpen: false

};


// ======================================================
// 33. LOAD REFERENCES INSTAGRAM FEED
// ======================================================

async function loadReferencesInstaFeed() {

  const section =
    document.getElementById(
      "references-section"
    );

  const grid =
    document.getElementById(
      "references-grid"
    );

  const loading =
    document.getElementById(
      "references-loading"
    );

  const empty =
    document.getElementById(
      "references-empty"
    );


  if (!section || !grid) {

    console.error(
      "References feed HTML component tidak ditemukan"
    );

    return;

  }


  try {

    if (loading) {

      loading.style.display =
        "block";

    }

    if (empty) {

      empty.style.display =
        "none";

    }

    grid.innerHTML = "";


    // ==================================================
    // PENTING:
    // Sebelumnya menggunakan API_BASE_URL.
    // Sekarang menggunakan API_URL yang memang
    // sudah didefinisikan di bagian atas.
    // ==================================================

    const response =
      await fetch(
        `${API_URL}?action=references&t=${Date.now()}`
      );


    if (!response.ok) {

      throw new Error(
        "Gagal menghubungi server."
      );

    }


    const data =
      await response.json();


    if (
      !data.success ||
      !Array.isArray(
        data.references
      )
    ) {

      throw new Error(
        "Failed to load references"
      );

    }


    referencesState.all =
      data.references;


    if (
      referencesState.all.length === 0
    ) {

      if (loading) {

        loading.style.display =
          "none";

      }

      if (empty) {

        empty.style.display =
          "block";

      }

      section.style.display =
        "block";

      return;

    }


    renderReferencesGrid(
      referencesState.all,
      grid
    );


    section.style.display =
      "block";


    if (loading) {

      loading.style.display =
        "none";

    }

    if (empty) {

      empty.style.display =
        "none";

    }

  }

  catch (error) {

    console.error(
      "Error loading references:",
      error
    );


    if (loading) {

      loading.style.display =
        "none";

    }

    if (empty) {

      empty.style.display =
        "block";

    }

    section.style.display =
      "block";

  }

}


// ======================================================
// 34. RENDER REFERENCES GRID
// ======================================================

function renderReferencesGrid(
  referencesData,
  container
) {

  container.innerHTML =
    referencesData
      .map(ref => {

        const imageUrls =
          parseImageUrls(
            ref.image_urls ||
            ref.image_url
          );

        const hasMultiple =
          imageUrls.length > 1;

        const hasDescription =
          ref.description &&
          String(
            ref.description
          ).trim();


        if (imageUrls.length === 0) {
          return "";
        }


        return `

          <div
            class="
              reference-card
              ${
                hasMultiple
                  ? "has-multiple"
                  : ""
              }
            "

            onclick="
              openReferencesModal(
                '${escapeAttribute(
                  ref.reference_id
                )}'
              )
            "

            tabindex="0"

            role="button"

            aria-label="${escapeAttribute(
              ref.title || "Referensi"
            )}"
          >

            <div
              class="
                reference-card-image-container
              "
            >

              <img
                class="
                  reference-card-image
                "

                src="${escapeAttribute(
                  imageUrls[0]
                )}"

                alt="${escapeAttribute(
                  ref.title ||
                  "Referensi Scrapbook"
                )}"

                loading="lazy"

                onload="
                  this.parentElement.style.background='transparent'
                "
              />

            </div>


            ${
              hasMultiple

                ? `
                  <div
                    class="
                      reference-card-multi-badge
                    "
                  >
                    📸
                    ${imageUrls.length}
                    images
                  </div>
                `

                : ""
            }


            <div
              class="
                reference-card-overlay
              "
            >

              <h3
                class="
                  reference-card-title
                "
              >
                ${escapeHtml(
                  ref.title || ""
                )}
              </h3>


              ${
                hasDescription

                  ? `
                    <p
                      class="
                        reference-card-description
                      "
                    >
                      ${escapeHtml(
                        ref.description
                      )}
                    </p>
                  `

                  : ""
              }

            </div>

          </div>

        `;

      })
      .join("");


  container
    .querySelectorAll(
      ".reference-card"
    )
    .forEach(card => {

      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            card.click();

          }

        }
      );

    });

}


// ======================================================
// 35. PARSE IMAGE URL
// ======================================================

function parseImageUrls(
  urlString
) {

  if (!urlString) {
    return [];
  }

  return String(urlString)

    .split(",")

    .map(
      url =>
        url.trim()
    )

    .filter(
      url =>
        url.length > 0
    );

}


// ======================================================
// 36. OPEN REFERENCES MODAL
// ======================================================

function openReferencesModal(
  referenceId
) {

  const reference =
    referencesState.all.find(
      item =>
        String(
          item.reference_id
        ) ===
        String(referenceId)
    );


  if (!reference) {
    return;
  }


  referencesState.currentViewId =
    referenceId;

  referencesState.currentImageIndex =
    0;


  const imageUrls =
    parseImageUrls(
      reference.image_urls ||
      reference.image_url
    );


  if (
    imageUrls.length === 0
  ) {

    return;

  }


  const hasMultiple =
    imageUrls.length > 1;


  const modalTitle =
    document.getElementById(
      "references-modal-title"
    );

  const modalDescription =
    document.getElementById(
      "references-modal-description"
    );

  const modalImage =
    document.getElementById(
      "references-modal-image"
    );

  const counter =
    document.getElementById(
      "references-image-counter"
    );

  const carouselControls =
    document.getElementById(
      "references-carousel-controls"
    );

  const modal =
    document.getElementById(
      "references-modal"
    );


  if (modalTitle) {

    modalTitle.textContent =
      reference.title || "";

  }


  if (modalDescription) {

    modalDescription.textContent =
      reference.description ||
      "Referensi inspirasi desain scrapbook";

  }


  if (modalImage) {

    modalImage.src =
      imageUrls[0];

  }


  if (counter) {

    counter.textContent =
      `1/${imageUrls.length}`;

  }


  if (carouselControls) {

    if (hasMultiple) {

      carouselControls.style.display =
        "flex";

      renderCarouselDots(
        imageUrls.length
      );

    }

    else {

      carouselControls.style.display =
        "none";

    }

  }


  if (!modal) {
    return;
  }


  modal.style.display =
    "flex";

  referencesState.isModalOpen =
    true;


  setupModalInteractions();


  document.body.style.overflow =
    "hidden";

}


// ======================================================
// 37. CLOSE REFERENCES MODAL
// ======================================================

function closeReferencesModal() {

  const modal =
    document.getElementById(
      "references-modal"
    );


  if (!modal) {
    return;
  }


  modal.style.display =
    "none";


  referencesState.isModalOpen =
    false;


  referencesState.currentViewId =
    null;


  document.body.style.overflow =
    "";

}


// ======================================================
// 38. NEXT IMAGE
// ======================================================

function nextReferenceImage() {

  const reference =
    referencesState.all.find(
      item =>
        String(
          item.reference_id
        ) ===
        String(
          referencesState.currentViewId
        )
    );


  if (!reference) {
    return;
  }


  const imageUrls =
    parseImageUrls(
      reference.image_urls ||
      reference.image_url
    );


  const maxIndex =
    imageUrls.length - 1;


  if (
    referencesState.currentImageIndex <
    maxIndex
  ) {

    referencesState.currentImageIndex++;

    updateModalImage(
      reference,
      imageUrls
    );

  }

}


// ======================================================
// 39. PREVIOUS IMAGE
// ======================================================

function prevReferenceImage() {

  const reference =
    referencesState.all.find(
      item =>
        String(
          item.reference_id
        ) ===
        String(
          referencesState.currentViewId
        )
    );


  if (!reference) {
    return;
  }


  if (
    referencesState.currentImageIndex >
    0
  ) {

    referencesState.currentImageIndex--;

    const imageUrls =
      parseImageUrls(
        reference.image_urls ||
        reference.image_url
      );

    updateModalImage(
      reference,
      imageUrls
    );

  }

}


// ======================================================
// 40. GO TO IMAGE
// ======================================================

function goToReferenceImage(
  index
) {

  const reference =
    referencesState.all.find(
      item =>
        String(
          item.reference_id
        ) ===
        String(
          referencesState.currentViewId
        )
    );


  if (!reference) {
    return;
  }


  const imageUrls =
    parseImageUrls(
      reference.image_urls ||
      reference.image_url
    );


  if (
    index >= 0 &&
    index < imageUrls.length
  ) {

    referencesState.currentImageIndex =
      index;

    updateModalImage(
      reference,
      imageUrls
    );

  }

}


// ======================================================
// 41. UPDATE MODAL IMAGE
// ======================================================

function updateModalImage(
  reference,
  imageUrls
) {

  const idx =
    referencesState.currentImageIndex;


  const modalImage =
    document.getElementById(
      "references-modal-image"
    );

  const counter =
    document.getElementById(
      "references-image-counter"
    );


  if (modalImage) {

    modalImage.src =
      imageUrls[idx];

  }


  if (counter) {

    counter.textContent =
      `${idx + 1}/${imageUrls.length}`;

  }


  document
    .querySelectorAll(
      ".carousel-dot"
    )
    .forEach(
      (dot, index) => {

        dot.classList.toggle(
          "active",
          index === idx
        );

      }
    );

}


// ======================================================
// 42. RENDER CAROUSEL DOTS
// ======================================================

function renderCarouselDots(
  count
) {

  const container =
    document.getElementById(
      "references-carousel-dots"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    Array.from(
      {
        length: count
      },
      (_, index) => `

        <div
          class="
            carousel-dot
            ${
              index === 0
                ? "active"
                : ""
            }
          "

          onclick="
            goToReferenceImage(
              ${index}
            )
          "

          role="button"

          tabindex="0"

          aria-label="
            Go to image
            ${index + 1}
          "
        ></div>

      `
    )
    .join("");


  container
    .querySelectorAll(
      ".carousel-dot"
    )
    .forEach(dot => {

      dot.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            dot.click();

          }

        }
      );

    });

}


// ======================================================
// 43. MODAL INTERACTIONS
// ======================================================

function setupModalInteractions() {

  const modal =
    document.getElementById(
      "references-modal"
    );


  if (!modal) {
    return;
  }


  // Hapus listener lama dengan clone
  // supaya tidak terjadi event listener ganda.

  const newModal =
    modal.cloneNode(true);


  modal.parentElement.replaceChild(
    newModal,
    modal
  );


  const overlay =
    newModal.querySelector(
      ".references-modal-overlay"
    );


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeReferencesModal
    );

  }


  document.addEventListener(
    "keydown",
    handleModalKeyboard
  );


  const carouselWrapper =
    newModal.querySelector(
      ".references-carousel-wrapper"
    );


  if (carouselWrapper) {

    carouselWrapper.addEventListener(
      "touchstart",
      handleTouchStart,
      {
        passive: true
      }
    );


    carouselWrapper.addEventListener(
      "touchend",
      handleTouchEnd,
      {
        passive: true
      }
    );

  }

}


// ======================================================
// 44. KEYBOARD MODAL
// ======================================================

function handleModalKeyboard(
  event
) {

  if (
    !referencesState.isModalOpen
  ) {

    return;

  }


  switch (event.key) {

    case "Escape":

      closeReferencesModal();

      break;


    case "ArrowRight":

      nextReferenceImage();

      break;


    case "ArrowLeft":

      prevReferenceImage();

      break;

  }

}


// ======================================================
// 45. TOUCH START
// ======================================================

function handleTouchStart(
  event
) {

  referencesState.touchStartX =
    event.changedTouches[0]
      .screenX;

}


// ======================================================
// 46. TOUCH END
// ======================================================

function handleTouchEnd(
  event
) {

  referencesState.touchEndX =
    event.changedTouches[0]
      .screenX;


  if (
    !referencesState.isModalOpen
  ) {

    return;

  }


  const reference =
    referencesState.all.find(
      item =>
        String(
          item.reference_id
        ) ===
        String(
          referencesState.currentViewId
        )
    );


  if (!reference) {
    return;
  }


  const minSwipeDistance =
    50;


  const difference =
    referencesState.touchStartX -
    referencesState.touchEndX;


  if (
    Math.abs(difference) >
    minSwipeDistance
  ) {

    if (difference > 0) {

      nextReferenceImage();

    }

    else {

      prevReferenceImage();

    }

  }

}


// ======================================================
// 47. ESCAPE HTML
// ======================================================

function escapeHtml(text) {

  if (!text) {
    return "";
  }

  const map = {

    "&": "&amp;",

    "<": "&lt;",

    ">": "&gt;",

    '"': "&quot;",

    "'": "&#039;"

  };

  return String(text)
    .replace(
      /[&<>"']/g,
      character =>
        map[character]
    );

}


// ======================================================
// 48. ESCAPE ATTRIBUTE
// ======================================================

function escapeAttribute(
  text
) {

  if (!text) {
    return "";
  }

  return String(text)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );

}


// ======================================================
// 49. CLOSE NEW REFERENCE MODAL
// ======================================================

document.addEventListener(
  "click",
  function(event) {

    const modal =
      document.getElementById(
        "references-modal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeReferencesModal();

    }

  }
);


// ======================================================
// 50. START WEBSITE
// ======================================================
//
// HTML kamu memanggil app.js di bagian paling bawah
// setelah seluruh elemen HTML dibuat.
// Jadi tidak perlu memindahkan seluruh kode ke
// DOMContentLoaded.
//
// Kita tetap menggunakan fungsi startup terpisah
// agar urutannya jelas.
// ======================================================

async function startWebsite() {

  console.log(
    "🚀 Nikiara.studio starting..."
  );


  // Produk
  await loadProducts();


  // Reference lama
  await loadReferences();


  // Reference Instagram Feed BARU
  await loadReferencesInstaFeed();


  console.log(
    "✅ Nikiara.studio loaded."
  );

}


// ======================================================
// START
// ======================================================

startWebsite();
