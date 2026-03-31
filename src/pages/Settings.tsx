import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { invoke } from "@tauri-apps/api/core";
import useAuthStore from "@/store/auth";
import LoginDialog from "@/components/LoginDialog";
import SignupDialog from "@/components/SignupDialog";

type Props = {};

const Settings = ({}: Props) => {
  const { theme, setTheme } = useTheme();
  const [skipBackward, setSkipBackward] = useState(10);
  const [skipForward, setSkipForward] = useState(30);
  const [defaultSpeed, setDefaultSpeed] = useState("1.0");
  const [autoRewind, setAutoRewind] = useState(true);
  const [autoRewindAmount, setAutoRewindAmount] = useState(5);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    invoke("get_settings", {}).then((settings: any) => {
      if (settings?.skip_backward) setSkipBackward(settings.skip_backward);
      if (settings?.skip_forward) setSkipForward(settings.skip_forward);
      if (settings?.default_speed) setDefaultSpeed(settings.default_speed);
      if (settings?.auto_rewind !== undefined) setAutoRewind(settings.auto_rewind);
      if (settings?.auto_rewind_amount) setAutoRewindAmount(settings.auto_rewind_amount);
    }).catch(() => {
    });
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "light" | "dark" | "system");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your listening experience</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="playback">Playback</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance" className="mt-6 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Theme</CardTitle>
              <CardDescription>Choose your preferred color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm">Color mode</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="mt-6 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Audio Settings</CardTitle>
              <CardDescription>Configure playback behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="default-speed" className="text-sm">Default playback speed</Label>
                <Select value={defaultSpeed} onValueChange={setDefaultSpeed}>
                  <SelectTrigger id="default-speed">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1.0">1.0x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="1.75">1.75x</SelectItem>
                    <SelectItem value="2.0">2.0x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="skip-backward" className="text-sm">Skip backward</Label>
                  <span className="text-sm text-muted-foreground tabular-nums">{skipBackward}s</span>
                </div>
                <Slider
                  id="skip-backward"
                  value={[skipBackward]}
                  onValueChange={(value) => setSkipBackward(value[0])}
                  max={60}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="skip-forward" className="text-sm">Skip forward</Label>
                  <span className="text-sm text-muted-foreground tabular-nums">{skipForward}s</span>
                </div>
                <Slider
                  id="skip-forward"
                  value={[skipForward]}
                  onValueChange={(value) => setSkipForward(value[0])}
                  max={60}
                  min={5}
                  step={5}
                  className="w-full"
                />
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Auto rewind on pause</Label>
                  <div className="text-xs text-muted-foreground">
                    Rewind a few seconds when pausing
                  </div>
                </div>
                <Switch checked={autoRewind} onCheckedChange={setAutoRewind} />
              </div>

              {autoRewind && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-rewind-amount" className="text-sm">Rewind amount</Label>
                    <span className="text-sm text-muted-foreground tabular-nums">{autoRewindAmount}s</span>
                  </div>
                  <Slider
                    id="auto-rewind-amount"
                    value={[autoRewindAmount]}
                    onValueChange={(value) => setAutoRewindAmount(value[0])}
                    max={30}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playback" className="mt-6 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Playback Options</CardTitle>
              <CardDescription>Configure how audiobooks are played</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Remember position</Label>
                  <div className="text-xs text-muted-foreground">
                    Save your listening position automatically
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>

              <Separator className="bg-border/50" />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Auto play next</Label>
                  <div className="text-xs text-muted-foreground">
                    Continue to next chapter or book
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? "Manage your account"
                  : "Sign in to enable cross-device sync"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Checking account status...</p>
              ) : isAuthenticated && user ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Email</Label>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Member since</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Separator className="bg-border/50" />
                  <Button variant="destructive" onClick={logout}>
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => setSignupOpen(true)}>Sign Up</Button>
                  <Button variant="outline" onClick={() => setLoginOpen(true)}>
                    Log In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
    </div>
  );
};

export default Settings;
