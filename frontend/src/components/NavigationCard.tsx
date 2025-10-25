import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NavigationCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
}

export default function NavigationCard({ title, description, icon, href }: NavigationCardProps) {
    return (
        <Link to={href} className="block">
            <Card className="cursor-pointer group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-primary`}>
                            {icon}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg mb-2">{title}</CardTitle>
                    <CardDescription className="text-sm">{description}</CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}
