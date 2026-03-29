from django.db import migrations


def parse_user_agents(apps, schema_editor):
    from user_agents import parse as parse_ua

    Visitor = apps.get_model("website_visitor_geolocator_core", "Visitor")
    visitors = Visitor.objects.filter(user_agent_parsed__isnull=True).exclude(user_agent="")
    batch_size = 500
    batch = []

    for visitor in visitors.iterator(chunk_size=batch_size):
        try:
            parsed = parse_ua(visitor.user_agent or "")
            visitor.user_agent_parsed = {
                "browser": parsed.browser.family,
                "browser_version": parsed.browser.version_string,
                "os": parsed.os.family,
                "os_version": parsed.os.version_string,
                "device_family": parsed.device.family,
                "device_brand": parsed.device.brand,
                "device_model": parsed.device.model,
                "is_mobile": parsed.is_mobile,
                "is_tablet": parsed.is_tablet,
                "is_pc": parsed.is_pc,
                "is_bot": parsed.is_bot,
                "is_touch_capable": parsed.is_touch_capable,
            }
        except Exception:
            visitor.user_agent_parsed = None

        batch.append(visitor)
        if len(batch) >= batch_size:
            Visitor.objects.bulk_update(batch, ["user_agent_parsed"])
            batch = []

    if batch:
        Visitor.objects.bulk_update(batch, ["user_agent_parsed"])


class Migration(migrations.Migration):

    dependencies = [
        ("website_visitor_geolocator_core", "0006_visitor_user_agent_parsed"),
    ]

    operations = [
        migrations.RunPython(parse_user_agents, migrations.RunPython.noop),
    ]
