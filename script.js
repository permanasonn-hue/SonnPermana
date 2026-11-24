
// ==========================================
// KANTIN BUK RINA
// SISTEM PEMESANAN DAN ANTREAN
// ==========================================

// 1. DATA MENU
const defaultMenus = [
    { id: 1, name: "Nasi Goreng", price: 12000, category: "Makanan", icon: "🍛" },
    { id: 2, name: "Mie Goreng", price: 10000, category: "Makanan", icon: "🍜" },
    { id: 3, name: "Ayam Geprek", price: 15000, category: "Makanan", icon: "🍗" },
    { id: 4, name: "Bakso", price: 12000, category: "Makanan", icon: "🍲" },
    { id: 5, name: "Es Teh", price: 4000, category: "Minuman", icon: "🥤" },
    { id: 6, name: "Jus Jeruk", price: 7000, category: "Minuman", icon: "🍊" },
    { id: 7, name: "Air Mineral", price: 3000, category: "Minuman", icon: "💧" },
    { id: 8, name: "Gorengan", price: 2000, category: "Camilan", icon: "🥟" }
];

// 2. PENYIMPANAN DATA
function loadData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        return fallback;
    }
}

let menus = loadData("bukrina_menus", defaultMenus);
let orders = loadData("bukrina_orders", []);
let cart = [];
let isAdmin = false;

function saveData() {
    localStorage.setItem("bukrina_menus", JSON.stringify(menus));
    localStorage.setItem("bukrina_orders", JSON.stringify(orders));
}

// 3. FUNGSI BANTUAN
function rupiah(number) {
    return "Rp" + Number(number).toLocaleString("id-ID");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[character];
    });
}

// 4. MENAMPILKAN MENU
function displayMenus() {
    const container = document.getElementById("menuList");
    const search = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;

    const filteredMenus = menus.filter(function (menu) {
        const matchName = menu.name.toLowerCase().includes(search);
        const matchCategory = category === "Semua" || menu.category === category;

        return matchName && matchCategory;
    });

    if (filteredMenus.length === 0) {
        container.innerHTML = '<p class="empty-message">Menu tidak ditemukan.</p>';
        return;
    }

    container.innerHTML = filteredMenus.map(function (menu) {
        return `
            <div class="menu-card">
                <div class="menu-icon">${escapeHTML(menu.icon)}</div>
                <h3>${escapeHTML(menu.name)}</h3>
                <p class="category">${escapeHTML(menu.category)}</p>
                <p class="price">${rupiah(menu.price)}</p>
                <button class="primary-button" data-action="add-cart"
                    data-id="${menu.id}">
                    + Tambah Pesanan
                </button>
            </div>
        `;
    }).join("");
}

// 5. MENAMBAHKAN MENU KE KERANJANG
function addToCart(id) {
    const menu = menus.find(function (item) {
        return item.id === id;
    });

    if (!menu) return;

    const existing = cart.find(function (item) {
        return item.id === id;
    });

    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: menu.id,
            name: menu.name,
            price: menu.price,
            icon: menu.icon,
            qty: 1
        });
    }

    displayCart();
}

// 6. MENAMPILKAN KERANJANG
function displayCart() {
    const container = document.getElementById("cartList");

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-message">Keranjang masih kosong.</p>';
        document.getElementById("cartTotal").textContent = rupiah(0);
        return;
    }

    container.innerHTML = cart.map(function (item) {
        return `
            <div class="cart-item">
                <div>
                    <strong>${escapeHTML(item.name)}</strong>
                    <p>${rupiah(item.price * item.qty)}</p>
                </div>

                <div class="quantity-controls">
                    <button data-action="decrease"
                        data-id="${item.id}">−</button>

                    <span>${item.qty}</span>

                    <button data-action="increase"
                        data-id="${item.id}">+</button>

                    <button class="delete-button"
                        data-action="remove-cart"
                        data-id="${item.id}">Hapus</button>
                </div>
            </div>
        `;
    }).join("");

    const total = cart.reduce(function (sum, item) {
        return sum + item.price * item.qty;
    }, 0);

    document.getElementById("cartTotal").textContent = rupiah(total);
}

// 7. MENGUBAH JUMLAH PESANAN
function changeQuantity(id, amount) {
    const item = cart.find(function (product) {
        return product.id === id;
    });

    if (!item) return;

    item.qty += amount;

    if (item.qty <= 0) {
        cart = cart.filter(function (product) {
            return product.id !== id;
        });
    }

    displayCart();
}

// 8. MEMBUAT PESANAN
function checkout(event) {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();

    if (!name) {
        alert("Masukkan nama pemesan terlebih dahulu!");
        return;
    }

    if (cart.length === 0) {
        alert("Keranjang masih kosong!");
        return;
    }

    const total = cart.reduce(function (sum, item) {
        return sum + item.price * item.qty;
    }, 0);

    const lastQueue = orders.reduce(function (max, order) {
        return Math.max(max, order.queue);
    }, 0);

    const newOrder = {
        id: Date.now(),
        queue: lastQueue + 1,
        name: name,
        items: cart.map(function (item) {
            return {
                id: item.id,
                name: item.name,
                qty: item.qty,
                price: item.price
            };
        }),
        total: total,
        status: "Menunggu",
        date: new Date().toLocaleString("id-ID")
    };

    orders.push(newOrder);
    cart = [];

    saveData();
    displayCart();
    displayCustomerOrders();
    displayAdminOrders();

    alert("Pesanan berhasil dibuat!\nNomor antrean: " + newOrder.queue);
}

// 9. MENAMPILKAN ANTREAN PELANGGAN
function displayCustomerOrders() {
    const container = document.getElementById("customerOrders");

    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-message">Belum ada pesanan.</p>';
        return;
    }

    container.innerHTML = [...orders].reverse().map(function (order) {
        return `
            <div class="order-card">
                <h3>Antrean #${order.queue}</h3>
                <p>Nama: ${escapeHTML(order.name)}</p>
                <p>Total: ${rupiah(order.total)}</p>
                <p>Tanggal: ${escapeHTML(order.date)}</p>
                <span class="status ${getStatusClass(order.status)}">
                    ${escapeHTML(order.status)}
                </span>
            </div>
        `;
    }).join("");
}

// 10. KELAS STATUS
function getStatusClass(status) {
    if (status === "Diproses") return "proses";
    if (status === "Selesai") return "selesai";
    return "";
}

// 11. LOGIN ADMIN
function loginAdmin() {
    if (isAdmin) {
        showAdmin();
        return;
    }

    const password = prompt("Masukkan password admin:");

    if (password === null) return;

    if (password === "admin") {
        isAdmin = true;
        showAdmin();
    } else {
        alert("Password salah!");
    }
}

// 12. MENAMPILKAN HALAMAN ADMIN
function showAdmin() {
    document.getElementById("customerSection").hidden = true;
    document.getElementById("adminSection").hidden = false;
    document.getElementById("adminButton").hidden = true;

    displayAdminMenus();
    displayAdminOrders();
}

// 13. KELUAR ADMIN
function logoutAdmin() {
    isAdmin = false;

    document.getElementById("customerSection").hidden = false;
    document.getElementById("adminSection").hidden = true;
    document.getElementById("adminButton").hidden = false;
}

// 14. MENAMBAHKAN MENU BARU
function addMenu(event) {
    event.preventDefault();

    const name = document.getElementById("menuName").value.trim();
    const price = Number(document.getElementById("menuPrice").value);
    const category = document.getElementById("menuCategory").value;
    const icon = document.getElementById("menuIcon").value.trim() || "🍽️";

    if (!name || !Number.isSafeInteger(price) || price <= 0) {
        alert("Nama dan harga menu harus diisi dengan benar!");
        return;
    }

    menus.push({
        id: Date.now(),
        name: name,
        price: price,
        category: category,
        icon: icon
    });

    saveData();

    document.getElementById("menuForm").reset();
    document.getElementById("menuIcon").value = "🍽️";

    displayMenus();
    displayAdminMenus();

    alert("Menu berhasil ditambahkan!");
}

// 15. MENAMPILKAN MENU ADMIN
function displayAdminMenus() {
    const container = document.getElementById("adminMenuList");

    if (menus.length === 0) {
        container.innerHTML = '<p class="empty-message">Belum ada menu.</p>';
        return;
    }

    container.innerHTML = menus.map(function (menu) {
        return `
            <div class="admin-menu-item">
                <div>
                    <strong>${escapeHTML(menu.icon)} ${escapeHTML(menu.name)}</strong>
                    <p>${rupiah(menu.price)} - ${escapeHTML(menu.category)}</p>
                </div>

                <button class="delete-button"
                    data-action="delete-menu"
                    data-id="${menu.id}">
                    Hapus
                </button>
            </div>
        `;
    }).join("");
}

// 16. MENGHAPUS MENU
function deleteMenu(id) {
    const menu = menus.find(function (item) {
        return item.id === id;
    });

    if (!menu) return;

    if (!confirm("Yakin ingin menghapus menu " + menu.name + "?")) {
        return;
    }

    menus = menus.filter(function (item) {
        return item.id !== id;
    });

    cart = cart.filter(function (item) {
        return item.id !== id;
    });

    saveData();
    displayMenus();
    displayCart();
    displayAdminMenus();
}

// 17. MENAMPILKAN PESANAN ADMIN
function displayAdminOrders() {
    const container = document.getElementById("adminOrderList");

    if (orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6">Belum ada pesanan.</td>
            </tr>
        `;
        return;
    }

    container.innerHTML = [...orders].reverse().map(function (order) {
        const items = order.items.map(function (item) {
            return escapeHTML(item.name) + " (" + item.qty + ")";
        }).join(", ");

        return `
            <tr>
                <td>#${order.queue}</td>
                <td>${escapeHTML(order.name)}</td>
                <td>${items}</td>
                <td>${rupiah(order.total)}</td>
                <td>
                    <span class="status ${getStatusClass(order.status)}">
                        ${escapeHTML(order.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="primary-button"
                            data-action="update-status"
                            data-id="${order.id}">
                            Ubah Status
                        </button>

                        <button class="delete-button"
                            data-action="delete-order"
                            data-id="${order.id}">
                            Hapus
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// 18. MENGUBAH STATUS PESANAN
function updateStatus(id) {
    const order = orders.find(function (item) {
        return item.id === id;
    });

    if (!order) return;

    const statuses = ["Menunggu", "Diproses", "Selesai"];
    const current = statuses.indexOf(order.status);
    const next = (current + 1) % statuses.length;

    order.status = statuses[next];

    saveData();
    displayAdminOrders();
    displayCustomerOrders();
}

// 19. MENGHAPUS PESANAN
function deleteOrder(id) {
    if (!confirm("Yakin ingin menghapus pesanan ini?")) {
        return;
    }

    orders = orders.filter(function (order) {
        return order.id !== id;
    });

    saveData();
    displayAdminOrders();
    displayCustomerOrders();
}

// 20. EVENT LISTENER MENU
document.getElementById("menuList").addEventListener("click", function (event) {
    const button = event.target.closest('[data-action="add-cart"]');

    if (button) {
        addToCart(Number(button.dataset.id));
    }
});

// 21. EVENT LISTENER KERANJANG
document.getElementById("cartList").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "increase") {
        changeQuantity(id, 1);
    }

    if (action === "decrease") {
        changeQuantity(id, -1);
    }

    if (action === "remove-cart") {
        cart = cart.filter(function (item) {
            return item.id !== id;
        });

        displayCart();
    }
});

// 22. EVENT LISTENER ADMIN MENU
document.getElementById("adminMenuList").addEventListener("click", function (event) {
    const button = event.target.closest('[data-action="delete-menu"]');

    if (button) {
        deleteMenu(Number(button.dataset.id));
    }
});

// 23. EVENT LISTENER ADMIN PESANAN
document.getElementById("adminOrderList").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "update-status") {
        updateStatus(id);
    }

    if (button.dataset.action === "delete-order") {
        deleteOrder(id);
    }
});

// 24. EVENT LISTENER FORM
document.getElementById("checkoutForm").addEventListener("submit", checkout);
document.getElementById("menuForm").addEventListener("submit", addMenu);

// 25. EVENT LISTENER PENCARIAN
document.getElementById("searchInput").addEventListener("input", displayMenus);

document.getElementById("categoryFilter").addEventListener("change", displayMenus);

// 26. EVENT LISTENER LOGIN DAN LOGOUT
document.getElementById("adminButton").addEventListener("click", loginAdmin);
document.getElementById("logoutButton").addEventListener("click", logoutAdmin);

// 27. MENJALANKAN WEBSITE
displayMenus();
displayCart();
displayCustomerOrders();
displayAdminMenus();
displayAdminOrders();

