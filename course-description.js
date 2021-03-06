var money_format = d3.format("$,.0f");

var formatters = {
    "dollars": money_format
};

function format_text(type, d) {
    if (type in formatters) {
        return formatters[type](d);
    }
    return d;
}

function grab_value(d, key, backup, default_value) {
    if (key && key in d) {
        return d[key];
    }
    if (backup && backup in d) {
        return grab_value(d, backup, null, default_value);
    }
    return default_value || "";
}

function handle_entry_object(d, container) {
    var containerd3 = d3.select(container);

    if (_.isObject(d)) {
        var is_url = grab_value(d, "url");
        if (is_url) {
            var a = containerd3.append("a").attr("href", grab_value(d, "url")).classed("hidden-print", true);
            handle_entry_object(grab_value(d, "link-text"), a[0][0]);
            var p = containerd3.append("span").classed("visible-print-inline-block", true);
            handle_entry_object(grab_value(d, "print-text", "link-text"), p[0][0]);
            if ("type" in d) {
                item_decorate(d["type"], a[0][0]);
                item_decorate(d["type"], p[0][0]);
            }

            return;
        }
        containerd3.text(format_text(d["format"], grab_value(d, "text")));

        if ("type" in d) {
            item_decorate(d["type"], container);
        }

        if ("subtext" in d) {
            var did_br = false;
            if (! _.isObject(d["subtext"]) || ! d["subtext"]["inline"]) {
                containerd3.append("br");
                did_br = true;
            }
            var subtext_container = containerd3.append("small");
            if (! did_br) {
                subtext_container.style ("margin-left", ".5em");
            }
            handle_entry_object(d["subtext"], subtext_container[0][0]);
        }
    } else {
        containerd3.text(d || "");
    }
}


function prepend_font_awesome(container, icon) {
    var children = d3.select(container).selectAll("*");
    if (!children.empty()) {
        d3.select(container).insert("i", ":first-child").classed("fa " + icon, true);
    } else {
        d3.select(container).html(function(d) {
            return "<i class = 'fa " + icon + "'></i> " + d3.select(this).text();
        });
    }
}

var font_awesome_decorators = {
    "phone": "fa-phone",
    "e-mail": "fa-envelope",
    "home": "fa-home",
    "GitHub": "fa-github-square",
    "papers": "fa-flask",
    "book" : "fa-book",
    "document" : "fa-file-text",
};

function item_decorate(type, container) {
    if (type in font_awesome_decorators) {
        prepend_font_awesome(container, font_awesome_decorators[type]);
    } else if (type == "label") {

        var children = d3.select(container).selectAll("*");
        if (!children.empty()) {
            $(container).wrap('<span class="label label-default"></span>');
        } else {
            var current_text = d3.select(container).text();
            d3.select(container).text("").append("span").classed("label label-default", true).text(current_text);
        }
    }

}

function populate_contact(container, key, data) {

    if (container.attr("data-style-header") == "on") {
        container.append("h4").text(key);
    }
    var address_block = container.append("address").classed("list-unstyled", true);
    var address_items = address_block.selectAll("span").data(data);
    address_items.enter().append("span");
    address_items.exit().remove();

    address_items.text(function(d) {
        return d.text || "";
    });
    address_items.each(function(item, index) {
        item_decorate(item["type"], this);
        if (index < data.length - 1) {
            d3.select(this).append("br");
        }
    });
}

function populate_list(container, key, data) {

    if (container.attr("data-style-header") == "on") {
        var header = container.append("h4").text(key);
        if ("subtext" in data) {
            header.append("br");
            header.append("small").text(data["subtext"]);
        }
    }
    var the_list;

    if (container.attr("data-list-type") == "ordered") {
        the_list = container.append ("ol");
    } else {
        the_list = container.append("ul").classed("list-unstyled", true);
    }
    var list_elements = the_list.selectAll("li").data(data);
    list_elements.enter().append("li");
    list_elements.each(function(d, i) {
        handle_entry_object(d, this);
    });
}

function populate_title(container, key, data) {


    container.each(function(d, i) {
        if (container.attr("data-style-header") == "on") {
            d3.select(this.parentNode).insert("h4",":first-child").text(key);
        }
        handle_entry_object(data, this);
    });

}


function populate_table(container, key, data) {

    if (container.attr("data-style-header") == "on") {
        var header = container.append("h4").text(key);
        if ("subtext" in data) {
            header.append("br");
            header.append("small").text(data["subtext"]);
        }
    }
    var the_table = container.append("table").classed("table table-striped table-condensed", true);
    var table_body = the_table.append("tbody").style ("font-size", "75%");

    var table_rows = table_body.selectAll("tr").data(data["rows"]);
    table_rows.enter().append("tr");
    var table_cells = table_rows.selectAll("td").data(function(d) {
        return d;
    });
    table_cells.enter().append("td");
    table_cells.each(function(d, i) {
        handle_entry_object(d, this);
    });
}

var data_populator = {
    'list': populate_list,
    'table': populate_table,
    'contact': populate_contact,
    'block': populate_title
};

var load_course_data = function(url) {
    d3.json(url, function(error, data) {
        if (data) {
            _.each(data, function(value, key) {
                var container = d3.select('[data-receiver-for="' + key + '"]');
                if (!container.empty() && container.length == 1) {
                    var pop = data_populator[container.attr("data-style-type") || "list"];
                    if (pop) pop(container, key, value);
                } else {
                    console.log ("No receiver for ", key);
                }
            });
        }
    });
};
