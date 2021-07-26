function menuCreator(level) {

    if (level == 0) {
        return [
            {name: "لوحة التحكم", url: "dashboard", icon: "fas fa-solar-panel"},
            {
                name: "إدارة المستخدم", url: "#", icon: "fas fa-user", items: [
                    {name: "إدارة المشرف", url: "admins"},
                    {name: "إدارة الحضور", url: "attendants"}
                ]
            },
            {
                name: "التصنيفات", url: "#", icon: "fas fa-list", url: "categories"
            },
            {
                name: "تأكيد الحضور", url: "#", icon: "fas fa-user-check", url: "attend_check"
            }


        ]
    }
    else {
        return [
            {name: "لوحة التحكم", url: "dashboard", icon: "fas fa-solar-panel"},
            {
                name: "تأكيد الحضور", url: "#", icon: "fas fa-user-check", url: "attend_check"
            }

        ]
    }
}


module.exports = menuCreator;

